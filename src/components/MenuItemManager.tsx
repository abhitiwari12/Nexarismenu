import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, UtensilsCrossed, AlertCircle, Image as ImageIcon, Check, X, Upload, Sparkles, Star, BookOpen, FileSpreadsheet, Download, CheckCircle2, UploadCloud, FileText } from 'lucide-react';
import { MenuItem, Category, UniversalCategory, UniversalMenuPreset } from '../types';
import { useAuth } from '../context/AuthContext';
import { createCategoryApi, createMenuItemApi, updateMenuItemApi, deleteMenuItemApi, uploadToCloudinaryApi, getUniversalCategoriesApi, getUniversalPresetsApi, adoptUniversalPresetApi, generateAiDescriptionApi } from '../services/api';
import { openGooglePicker, PickedDriveFile } from '../firebase/googlePicker';
import { ImagePicker } from './ImagePicker';
import { ImageCropModal } from './ImageCropModal';

interface ParsedCsvRow {
  id: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isJain?: boolean;
  isNoOnionGarlic?: boolean;
  isVegan?: boolean;
  imageUrl: string;
  isValid: boolean;
  error?: string;
  isNewCategory: boolean;
}

interface MenuItemManagerProps {
  items: MenuItem[];
  categories: Category[];
  onRefresh: () => void;
}

export const MenuItemManager: React.FC<MenuItemManagerProps> = ({
  items,
  categories,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [displayItems, setDisplayItems] = useState<MenuItem[]>(items);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Keep local display items in sync with parent items prop when updated
  useEffect(() => {
    setDisplayItems(items);
  }, [items]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Image Crop states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [cropFileName, setCropFileName] = useState<string>('');

  // Universal Presets states
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [universalCats, setUniversalCats] = useState<UniversalCategory[]>([]);
  const [selectedUCat, setSelectedUCat] = useState<string>('all');
  const [universalPresets, setUniversalPresets] = useState<UniversalMenuPreset[]>([]);
  const [presetPrices, setPresetPrices] = useState<Record<string, string>>({});
  const [presetTargetCat, setPresetTargetCat] = useState<Record<string, string>>({});
  const [adoptingPresetIds, setAdoptingPresetIds] = useState<Record<string, boolean>>({});
  const [presetSuccessMsg, setPresetSuccessMsg] = useState<string | null>(null);

  // CSV Import states
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedRows, setCsvParsedRows] = useState<ParsedCsvRow[]>([]);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportProgress, setCsvImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [csvImportSuccessMsg, setCsvImportSuccessMsg] = useState<string | null>(null);

  const downloadCsvTemplate = () => {
    const content = `Category,Name,Description,Price,Is_Veg,Image_URL
Starters,Paneer Tikka,Grilled spiced cottage cheese skewers,12.99,yes,https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80
Starters,Crispy Spring Rolls,Vegetable filled spring rolls with dip,8.50,yes,
Main Course,Butter Chicken,Tender chicken in rich creamy tomato sauce,16.99,no,https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80
Beverages,Mango Lassi,Refreshing sweet yogurt smoothie,4.99,yes,
Desserts,Gulab Jamun,Warm milk dumplings in sugar syrup,5.99,yes,`;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'menu_items_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvContent = (text: string): ParsedCsvRow[] => {
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && text[i + 1] === '\n') {
          i++;
        }
        if (currentLine.trim()) lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) lines.push(currentLine);

    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let quotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (quotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            quotes = !quotes;
          }
        } else if (c === ',' && !quotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    const findHeaderIdx = (possibleKeys: string[]) => {
      return headers.findIndex((h) => possibleKeys.some((k) => h.includes(k)));
    };

    const catIdx = findHeaderIdx(['cat', 'category']);
    const nameIdx = findHeaderIdx(['name', 'title', 'dish', 'item']);
    const descIdx = findHeaderIdx(['desc', 'details', 'about']);
    const priceIdx = findHeaderIdx(['price', 'cost', 'rate', 'amount']);
    const vegIdx = findHeaderIdx(['veg', 'is_veg', 'vegetarian']);
    const jainIdx = findHeaderIdx(['jain', 'is_jain']);
    const nogIdx = findHeaderIdx(['no_onion', 'no_garlic', 'nog', 'is_no_onion_garlic']);
    const veganIdx = findHeaderIdx(['vegan', 'is_vegan']);
    const imgIdx = findHeaderIdx(['image', 'img', 'photo', 'url']);

    const rows: ParsedCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.every((v) => !v)) continue;

      const rawCategory = catIdx >= 0 ? values[catIdx] : '';
      const rawName = nameIdx >= 0 ? values[nameIdx] : '';
      const rawDesc = descIdx >= 0 ? values[descIdx] : '';
      const rawPrice = priceIdx >= 0 ? values[priceIdx] : '';
      const rawVeg = vegIdx >= 0 ? values[vegIdx] : 'yes';
      const rawJain = jainIdx >= 0 ? values[jainIdx] : '';
      const rawNog = nogIdx >= 0 ? values[nogIdx] : '';
      const rawVegan = veganIdx >= 0 ? values[veganIdx] : '';
      const rawImg = imgIdx >= 0 ? values[imgIdx] : '';

      const categoryName = rawCategory.trim();
      const name = rawName.trim();
      const description = rawDesc.trim();
      const priceNum = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      const vegLower = rawVeg.trim().toLowerCase();
      const isVeg = ['true', 'yes', '1', 'veg', 'y'].includes(vegLower);
      const isJain = ['true', 'yes', '1', 'jain', 'y'].includes(rawJain.trim().toLowerCase());
      const isNoOnionGarlic = ['true', 'yes', '1', 'no onion', 'nog', 'y'].includes(rawNog.trim().toLowerCase());
      const isVegan = ['true', 'yes', '1', 'vegan', 'y'].includes(rawVegan.trim().toLowerCase());

      let isValid = true;
      let error = '';

      if (!name) {
        isValid = false;
        error = 'Missing dish name';
      } else if (!categoryName) {
        isValid = false;
        error = 'Missing category name';
      } else if (isNaN(priceNum) || priceNum < 0) {
        isValid = false;
        error = 'Invalid price';
      }

      const matchedCat = categories.find(
        (c) => c.name.trim().toLowerCase() === categoryName.toLowerCase()
      );

      rows.push({
        id: `csv_row_${i}`,
        categoryName: categoryName || 'Uncategorized',
        name,
        description,
        price: isNaN(priceNum) ? 0 : priceNum,
        isVeg,
        isJain,
        isNoOnionGarlic,
        isVegan,
        imageUrl: rawImg.trim(),
        isValid,
        error,
        isNewCategory: !matchedCat && Boolean(categoryName),
      });
    }

    return rows;
  };

  const handleCsvFileChange = (file: File) => {
    setCsvFile(file);
    setCsvImportSuccessMsg(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseCsvContent(text);
        setCsvParsedRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    const validRows = csvParsedRows.filter((r) => r.isValid);
    if (validRows.length === 0 || !user) return;

    setIsImportingCsv(true);
    setError(null);
    setCsvImportProgress({ current: 0, total: validRows.length });

    const catMap = new Map<string, string>();
    categories.forEach((c) => {
      catMap.set(c.name.trim().toLowerCase(), c.id);
    });

    let createdCategoriesCount = 0;
    let importedItemsCount = 0;

    try {
      // 1. Auto-create missing categories
      for (const row of validRows) {
        const cleanCatName = row.categoryName.trim();
        const catKey = cleanCatName.toLowerCase();

        if (!catMap.has(catKey)) {
          const newCat = await createCategoryApi(cleanCatName);
          catMap.set(catKey, newCat.id);
          createdCategoriesCount++;
        }
      }

      // 2. Create menu items
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const catId = catMap.get(row.categoryName.trim().toLowerCase());

        if (catId) {
          await createMenuItemApi({
            category_id: catId,
            name: row.name,
            description: row.description,
            price: row.price,
            image_url: row.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
            is_veg: row.isVeg,
            is_jain: row.isJain,
            is_no_onion_garlic: row.isNoOnionGarlic,
            is_vegan: row.isVegan,
            is_available: true,
          });
          importedItemsCount++;
        }
        setCsvImportProgress({ current: i + 1, total: validRows.length });
      }

      setCsvImportSuccessMsg(
        `Successfully imported ${importedItemsCount} menu items!${
          createdCategoriesCount > 0 ? ` (${createdCategoriesCount} new categories created)` : ''
        }`
      );

      onRefresh();

      // Clear file after short delay
      setCsvFile(null);
      setCsvParsedRows([]);
    } catch (err: any) {
      setError(err.message || 'Failed during CSV import.');
    } finally {
      setIsImportingCsv(false);
      setCsvImportProgress(null);
    }
  };

  useEffect(() => {
    getUniversalCategoriesApi().then(setUniversalCats).catch(() => {});
  }, []);

  useEffect(() => {
    if (isPresetModalOpen) {
      getUniversalPresetsApi(selectedUCat === 'all' ? undefined : selectedUCat)
        .then((presets) => {
          setUniversalPresets(presets);
          // Pre-populate prices and target categories
          const initialPrices: Record<string, string> = {};
          const initialTargetCats: Record<string, string> = {};
          presets.forEach((p) => {
            initialPrices[p.id] = String(p.suggested_price);
            // Match category if possible, else default to first category
            const matchedCat = categories.find(
              (c) => c.universal_category_id === p.universal_category_id || c.name.toLowerCase().includes(p.cuisine.toLowerCase())
            );
            initialTargetCats[p.id] = matchedCat ? matchedCat.id : (categories[0]?.id || '');
          });
          setPresetPrices((prev) => ({ ...initialPrices, ...prev }));
          setPresetTargetCat((prev) => ({ ...initialTargetCats, ...prev }));
        })
        .catch(() => {});
    }
  }, [isPresetModalOpen, selectedUCat, categories]);

  const handleAdoptPreset = async (preset: UniversalMenuPreset) => {
    const targetCatId = presetTargetCat[preset.id] || categories[0]?.id;
    if (!targetCatId) {
      setError('Please create or select a menu category first.');
      return;
    }

    const priceNum = parseFloat(presetPrices[preset.id]) || preset.suggested_price;

    const tempId = `temp_preset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const optimisticItem: MenuItem = {
      id: tempId,
      user_id: user?.id || '',
      category_id: targetCatId,
      master_item_id: preset.id,
      name: preset.name,
      description: preset.description,
      price: priceNum,
      image_url: preset.image_url,
      is_veg: preset.is_veg,
      is_jain: preset.is_jain || false,
      is_no_onion_garlic: preset.is_no_onion_garlic || false,
      is_vegan: preset.is_vegan || false,
      is_available: true,
      created_at: new Date().toISOString(),
    };

    const previousItems = displayItems;
    // Optimistic UI update
    setDisplayItems((prev) => [optimisticItem, ...prev]);
    setAdoptingPresetIds((prev) => ({ ...prev, [preset.id]: true }));
    setPresetSuccessMsg(`"${preset.name}" added to your menu at $${priceNum.toFixed(2)}!`);
    setError(null);

    try {
      await adoptUniversalPresetApi(targetCatId, preset.id, priceNum);
      onRefresh();
    } catch (err: any) {
      // Rollback on failure
      setDisplayItems(previousItems);
      setPresetSuccessMsg(null);
      setError(err.message || 'Failed to add preset menu item.');
    } finally {
      setAdoptingPresetIds((prev) => ({ ...prev, [preset.id]: false }));
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_veg: true,
    is_jain: false,
    is_no_onion_garlic: false,
    is_vegan: false,
    is_bestseller: false,
    is_todays_special: false,
    is_available: true,
    calories: '',
    grams: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI Description states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTone, setAiTone] = useState<'gourmet' | 'punchy' | 'storyteller' | 'health'>('gourmet');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      setAiError('Please enter a dish name first.');
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const categoryName = categories.find((c) => c.id === formData.category_id)?.name || '';
      const result = await generateAiDescriptionApi({
        name: formData.name.trim(),
        categoryName,
        isVeg: formData.is_veg,
        keywords: aiKeywords,
        tone: aiTone,
      });
      setFormData((prev) => ({
        ...prev,
        description: result.description,
      }));
      setAiMessage(`Gourmet description generated! Suggested tags: ${result.suggestedTags.join(', ')}`);
    } catch (err: any) {
      console.error('AI generation error:', err);
      setAiError(err.message || 'Failed to generate description. Please check your network connection.');
    } finally {
      setAiGenerating(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      is_veg: true,
      is_jain: false,
      is_no_onion_garlic: false,
      is_vegan: false,
      is_bestseller: false,
      is_todays_special: false,
      is_available: true,
      calories: '',
      grams: '',
    });
    setError(null);
    setAiKeywords('');
    setAiTone('gourmet');
    setAiMessage(null);
    setAiError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category_id: item.category_id,
      image_url: item.image_url,
      is_veg: item.is_veg,
      is_jain: item.is_jain || false,
      is_no_onion_garlic: item.is_no_onion_garlic || false,
      is_vegan: item.is_vegan || false,
      is_bestseller: item.is_bestseller || false,
      is_todays_special: item.is_todays_special || false,
      is_available: item.is_available,
      calories: item.calories ? String(item.calories) : '',
      grams: item.grams ? String(item.grams) : '',
    });
    setError(null);
    setAiKeywords('');
    setAiTone('gourmet');
    setAiMessage(null);
    setAiError(null);
    setIsModalOpen(true);
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const initiateImageCrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCropImageSrc(reader.result as string);
        setCropFileName(file.name);
        setIsCropModalOpen(true);
      }
    };
    reader.onerror = () => {
      setError('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      initiateImageCrop(file);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!user) return;
    setUploadingImage(true);
    setError(null);

    try {
      const { url } = await uploadToCloudinaryApi(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
    } catch (err: any) {
      setError(err.message || 'Cloudinary image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      initiateImageCrop(file);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsCropModalOpen(false);
    await processFileUpload(croppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id || !user) {
      setError('Dish name and category are required.');
      return;
    }

    setError(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price) || 0,
      category_id: formData.category_id,
      image_url: formData.image_url,
      is_veg: formData.is_veg,
      is_jain: formData.is_jain,
      is_no_onion_garlic: formData.is_no_onion_garlic,
      is_vegan: formData.is_vegan,
      is_bestseller: formData.is_bestseller,
      is_todays_special: formData.is_todays_special,
      is_available: formData.is_available,
      calories: formData.calories ? Number(formData.calories) : null,
      grams: formData.grams ? Number(formData.grams) : null,
    };

    const previousItems = displayItems;

    if (editingItem) {
      const updatedItem: MenuItem = {
        ...editingItem,
        ...payload,
      };
      // Optimistic update
      setDisplayItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? updatedItem : i))
      );
      setIsModalOpen(false);

      try {
        await updateMenuItemApi(editingItem.id, payload);
        onRefresh();
      } catch (err: any) {
        // Rollback on failure
        setDisplayItems(previousItems);
        setIsModalOpen(true);
        setError(err.message || 'Failed to save menu item.');
      }
    } else {
      const tempId = `temp_item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newItem: MenuItem = {
        id: tempId,
        user_id: user.id,
        ...payload,
        created_at: new Date().toISOString(),
      };

      // Optimistic addition
      setDisplayItems((prev) => [newItem, ...prev]);
      setIsModalOpen(false);

      try {
        await createMenuItemApi(payload);
        onRefresh();
      } catch (err: any) {
        // Rollback on failure
        setDisplayItems(previousItems);
        setIsModalOpen(true);
        setError(err.message || 'Failed to save menu item.');
      }
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const previousItems = displayItems;
    const newAvailability = !item.is_available;

    // Optimistically toggle availability
    setDisplayItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: newAvailability } : i))
    );

    try {
      await updateMenuItemApi(item.id, { is_available: newAvailability });
      onRefresh();
    } catch (e: any) {
      // Rollback on failure
      setDisplayItems(previousItems);
      setError(e.message || 'Failed to toggle availability.');
    }
  };

  const handleToggleBestseller = async (item: MenuItem) => {
    const previousItems = displayItems;
    const newBestseller = !item.is_bestseller;
    setDisplayItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_bestseller: newBestseller } : i))
    );
    try {
      await updateMenuItemApi(item.id, { is_bestseller: newBestseller });
      onRefresh();
    } catch (e: any) {
      setDisplayItems(previousItems);
      setError(e.message || 'Failed to toggle bestseller.');
    }
  };

  const handleToggleSpecial = async (item: MenuItem) => {
    const previousItems = displayItems;
    const newSpecial = !item.is_todays_special;
    setDisplayItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_todays_special: newSpecial } : i))
    );
    try {
      await updateMenuItemApi(item.id, { is_todays_special: newSpecial });
      onRefresh();
    } catch (e: any) {
      setDisplayItems(previousItems);
      setError(e.message || 'Failed to toggle Today\'s Special.');
    }
  };

  const handleDelete = async (id: string) => {
    const previousItems = displayItems;

    // Optimistically remove item
    setDisplayItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
    setError(null);

    try {
      await deleteMenuItemApi(id);
      onRefresh();
    } catch (e: any) {
      // Rollback on failure
      setDisplayItems(previousItems);
      setError(e.message || 'Failed to delete menu item.');
    }
  };

  // Filter items using displayItems
  const filteredItems = displayItems.filter((item) => {
    const categoryName = categories.find((c) => c.id === item.category_id)?.name || '';
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      categoryName.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Menu Items</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your dishes, descriptions, pricing, veg status, and stock availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-sm transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Preset Catalog</span>
          </button>
          <button
            onClick={openAddModal}
            disabled={categories.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Dish</span>
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Please add at least one category before creating menu items.</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between transition-colors">
        {/* Search Input & Mobile Category Select */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search dish name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Dropdown for Compact Layouts */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories ({displayItems.length})</option>
            {categories.map((cat) => {
              const count = displayItems.filter((i) => i.category_id === cat.id).length;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({count})
                </option>
              );
            })}
          </select>

          {(searchTerm || selectedCategory !== 'all') && (
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap hidden lg:inline-block">
              Showing {filteredItems.length} of {displayItems.length}
            </span>
          )}
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({displayItems.length})
          </button>
          {categories.map((cat) => {
            const catCount = displayItems.filter((i) => i.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-indigo-600 dark:bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name} ({catCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 transition-colors">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No dishes match your search or category.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Add Menu Item" to create new menu entries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const categoryName = categories.find((c) => c.id === item.category_id)?.name || 'Uncategorized';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden group cursor-pointer" onClick={() => item.image_url && setSelectedPreviewImage(item.image_url)}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          // Fallback on broken URL
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}

                    {item.image_url && (
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-xs font-semibold text-white bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Click to View</span>
                        </span>
                      </div>
                    )}

                    {/* Cloudinary / Storage Indicator */}
                    {item.image_url?.includes('cloudinary') && (
                      <div className="absolute bottom-2.5 right-2.5 bg-indigo-900/90 backdrop-blur-xs text-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-500/30">
                        Cloudinary CDN
                      </div>
                    )}

                    {/* Veg / Non-Veg Indicator Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/40 dark:border-slate-700/40 shadow-xs flex items-center gap-1.5">
                      <div
                        className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          item.is_veg ? 'border-emerald-600 bg-white dark:bg-slate-900' : 'border-red-600 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {item.is_veg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>

                    {/* Category Tag */}
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-medium">
                      {categoryName}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h3>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                          ${item.price.toFixed(2)}
                        </span>
                        <div className="flex flex-col items-end gap-0.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {item.calories !== undefined && item.calories !== null && (
                            <span>{item.calories} kcal</span>
                          )}
                          {item.grams !== undefined && item.grams !== null && (
                            <span>{item.grams} gms</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {(item.is_jain || item.is_no_onion_garlic || item.is_vegan || item.is_bestseller || item.is_todays_special) && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 mt-1">
                        {item.is_bestseller && (
                          <span className="text-[10px] font-black text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md border border-amber-400 uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                            <Star className="w-2.5 h-2.5 fill-amber-900" />
                            Bestseller
                          </span>
                        )}
                        {item.is_todays_special && (
                          <span className="text-[10px] font-black text-rose-900 bg-rose-200 px-2 py-0.5 rounded-md border border-rose-300 uppercase tracking-wide flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5 fill-rose-900" />
                            Today's Special
                          </span>
                        )}
                        {item.is_jain && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50 uppercase tracking-wide">
                            Jain
                          </span>
                        )}
                        {item.is_no_onion_garlic && (
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/50 uppercase tracking-wide">
                            No Onion Garlic
                          </span>
                        )}
                        {item.is_vegan && (
                          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/50 uppercase tracking-wide">
                            Vegan
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Availability Switch */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        item.is_available
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                          : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900'
                      }`}
                    >
                      {item.is_available ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>

                    {/* Quick Bestseller Toggle */}
                    <button
                      onClick={() => handleToggleBestseller(item)}
                      title="Toggle Bestseller status"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition border ${
                        item.is_bestseller
                          ? 'bg-amber-300 text-amber-950 border-amber-400'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${item.is_bestseller ? 'fill-amber-950' : ''}`} />
                      <span>Bestseller</span>
                    </button>

                    {/* Quick Today's Special Toggle */}
                    <button
                      onClick={() => handleToggleSpecial(item)}
                      title="Toggle Today's Special status"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition border ${
                        item.is_todays_special
                          ? 'bg-rose-200 text-rose-950 border-rose-300'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className={`w-3 h-3 ${item.is_todays_special ? 'fill-rose-950' : ''}`} />
                      <span>Special</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                      title="Edit dish"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Margherita Pizza"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="14.50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Quantity (grams / gms)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 250"
                    value={formData.grams}
                    onChange={(e) => setFormData({ ...formData, grams: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Dietary Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_veg: true })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                        formData.is_veg
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Vegetarian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_veg: false })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                        !formData.is_veg
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Highlights & Specials */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Highlights & Specials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_bestseller: !formData.is_bestseller })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition ${
                      formData.is_bestseller
                        ? 'border-amber-500 bg-amber-300 text-amber-950 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_bestseller}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 pointer-events-none"
                    />
                    <Star className={`w-4 h-4 ${formData.is_bestseller ? 'fill-amber-950' : ''}`} />
                    <span>Mark as Bestseller ★</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_todays_special: !formData.is_todays_special })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition ${
                      formData.is_todays_special
                        ? 'border-rose-300 bg-rose-200 text-rose-950 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_todays_special}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 pointer-events-none"
                    />
                    <Sparkles className={`w-4 h-4 ${formData.is_todays_special ? 'fill-rose-950' : ''}`} />
                    <span>Today's Special ✨</span>
                  </button>
                </div>
              </div>

              {/* Jain, No Onion Garlic & Vegan options */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Special Dietary Preferences
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_jain: !formData.is_jain })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition ${
                      formData.is_jain
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_jain}
                      onChange={() => {}} // handled by button onClick
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 pointer-events-none"
                    />
                    <span>Jain Food</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_no_onion_garlic: !formData.is_no_onion_garlic })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition ${
                      formData.is_no_onion_garlic
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_no_onion_garlic}
                      onChange={() => {}} // handled by button onClick
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 pointer-events-none"
                    />
                    <span>No Onion Garlic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_vegan: !formData.is_vegan })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition ${
                      formData.is_vegan
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_vegan}
                      onChange={() => {}} // handled by button onClick
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 pointer-events-none"
                    />
                    <span>Vegan Food</span>
                  </button>
                </div>
              </div>

              {/* AI Description Assistant Panel */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-4 border border-indigo-100/60 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      AI Copywriting Assistant
                    </span>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Gemini
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Include Ingredients / Keywords
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. fresh basil, cherry tomatoes"
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Writing Tone
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: 'Gourmet', value: 'gourmet' },
                        { label: 'Punchy', value: 'punchy' },
                        { label: 'Story', value: 'storyteller' },
                        { label: 'Health', value: 'health' }
                      ].map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setAiTone(t.value as any)}
                          className={`px-1 py-1.5 rounded-lg text-[9px] font-black border transition cursor-pointer text-center truncate ${
                            aiTone === t.value
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={t.label}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-100/30 dark:border-indigo-900/10">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-[70%]">
                    Crafts a creative description for your menu card. Make sure to fill in the dish name above first!
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiGenerating || !formData.name.trim()}
                    className="px-3 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Crafting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {aiError}
                  </p>
                )}

                {aiMessage && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✨ {aiMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Ingredients, preparation style, allergen info..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Dish Image & Cloudinary Upload
                </label>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {uploadingImage ? (
                    <div className="py-4 space-y-2">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        Uploading image to Cloudinary...
                      </p>
                    </div>
                  ) : formData.image_url ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-900 group">
                        <img
                          src={formData.image_url}
                          alt="Dish Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-left space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Current Image Preview
                          </span>
                          {formData.image_url.includes('cloudinary') && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                              Cloudinary CDN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {formData.image_url}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer transition">
                            <Upload className="w-3 h-3" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsImagePickerOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                          >
                            Select Preset
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Drag & drop dish image here, or <label className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer">browse file</label>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Uploaded directly to secure Firebase Storage (JPG, PNG, WEBP max 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="modal-dish-file-input"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="url"
                    placeholder="Or enter image URL (https://...)"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <label
                      htmlFor="modal-dish-file-input"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await openGooglePicker((file: PickedDriveFile) => {
                            setFormData((prev) => ({ ...prev, image_url: file.url }));
                          });
                        } catch (err) {
                          console.error('Drive picker error:', err);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/80 text-xs font-semibold transition flex items-center gap-1.5"
                      title="Select from Google Drive"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#0066DA" d="m6 6 14 26 23-32z"/>
                        <path fill="#00AC47" d="m43 0 23 32h-46z"/>
                        <path fill="#EA4335" d="m66 32 21 32h-46z"/>
                        <path fill="#00832D" d="m20 32 14 26h46z"/>
                        <path fill="#2684FC" d="m34 58-14 20h46z"/>
                        <path fill="#FFBA00" d="m20 32 23 46h-23z"/>
                      </svg>
                      <span>Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      Presets
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Currently Available in stock for ordering
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm transition disabled:opacity-50"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url) => setFormData({ ...formData, image_url: url })}
        title="Select Food Image"
        type="food"
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={cropImageSrc}
        fileName={cropFileName}
        onCropComplete={handleCropComplete}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Menu Item?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to remove this dish from your menu?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
              >
                Yes, Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Presets Catalog Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-4xl w-full my-8 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Universal Dish Preset Catalog</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select pre-configured dishes and set your own restaurant pricing</p>
                </div>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {presetSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{presetSuccessMsg}</span>
              </div>
            )}

            {/* Universal Category Filter Tabs */}
            <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedUCat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedUCat === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Presets ({universalPresets.length})
              </button>
              {universalCats.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => setSelectedUCat(uc.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedUCat === uc.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {uc.name}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4">
              {universalPresets.map((preset) => {
                const isAdopting = !!adoptingPresetIds[preset.id];
                const alreadyAdded = items.some((i) => i.master_item_id === preset.id || (i.name.toLowerCase().trim() === preset.name.toLowerCase().trim() && i.category_id === (presetTargetCat[preset.id] || categories[0]?.id)));

                return (
                  <div
                    key={preset.id}
                    className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                  >
                    <div>
                      <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-slate-200 dark:bg-slate-700">
                        <img
                          src={preset.image_url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            preset.is_veg
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {preset.is_veg ? 'VEG' : 'NON-VEG'}
                        </span>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                          {preset.cuisine}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{preset.name}</h4>
                      {(preset.is_jain || preset.is_no_onion_garlic || preset.is_vegan) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1 mb-1.5">
                          {preset.is_jain && (
                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/50 uppercase">
                              Jain
                            </span>
                          )}
                          {preset.is_no_onion_garlic && (
                            <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/50 uppercase">
                              No Onion Garlic
                            </span>
                          )}
                          {preset.is_vegan && (
                            <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800/50 uppercase">
                              Vegan
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Target Category:
                        </label>
                        <select
                          value={presetTargetCat[preset.id] || categories[0]?.id || ''}
                          onChange={(e) => setPresetTargetCat({ ...presetTargetCat, [preset.id]: e.target.value })}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Your Menu Price ($):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={presetPrices[preset.id] || ''}
                          onChange={(e) => setPresetPrices({ ...presetPrices, [preset.id]: e.target.value })}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 text-right"
                        />
                      </div>

                      <button
                        onClick={() => handleAdoptPreset(preset)}
                        disabled={alreadyAdded || isAdopting || categories.length === 0}
                        className={`w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          alreadyAdded
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-not-allowed'
                            : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-xs'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>In Your Menu</span>
                          </>
                        ) : isAdopting ? (
                          <span>Adding to Menu...</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Menu</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Import Menu via CSV</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a spreadsheet to quickly create dishes and categories in bulk.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvFile(null);
                  setCsvParsedRows([]);
                  setCsvImportSuccessMsg(null);
                  setError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {csvImportSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{csvImportSuccessMsg}</span>
                  </div>
                </div>
              )}

              {/* Action bar: Template Download */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold block text-slate-900 dark:text-white">Need a template?</span>
                  Download our formatted CSV template with required column headers.
                </div>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-2xs shrink-0 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!csvFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingCsv(true); }}
                  onDragLeave={() => setIsDraggingCsv(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingCsv(false);
                    if (e.dataTransfer.files?.[0]) handleCsvFileChange(e.dataTransfer.files[0]);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                    isDraggingCsv
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/30'
                  }`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv, text/csv';
                    input.onchange = (e: any) => {
                      if (e.target.files?.[0]) handleCsvFileChange(e.target.files[0]);
                    };
                    input.click();
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Supports .csv files up to 5MB (Columns: Category, Name, Description, Price, Is_Veg, Image_URL)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected File Details */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{csvFile.name}</p>
                        <p className="text-[11px] text-slate-400">{(csvFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvFile(null);
                        setCsvParsedRows([]);
                        setCsvImportSuccessMsg(null);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Parsed Items Summary Badges */}
                  {csvParsedRows.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Total Rows: {csvParsedRows.length}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Valid Items: {csvParsedRows.filter((r) => r.isValid).length}
                      </span>
                      {csvParsedRows.some((r) => r.isNewCategory && r.isValid) && (
                        <span className="px-2.5 py-1 rounded-lg font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          New Categories to Create: {new Set(csvParsedRows.filter((r) => r.isNewCategory && r.isValid).map((r) => r.categoryName.toLowerCase())).size}
                        </span>
                      )}
                      {csvParsedRows.some((r) => !r.isValid) && (
                        <span className="px-2.5 py-1 rounded-lg font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Invalid Rows: {csvParsedRows.filter((r) => !r.isValid).length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Preview Table */}
                  {csvParsedRows.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Dish Name</th>
                            <th className="p-2.5">Price</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {csvParsedRows.map((row) => (
                            <tr
                              key={row.id}
                              className={!row.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}
                            >
                              <td className="p-2.5 text-slate-800 dark:text-slate-200">
                                {row.categoryName}
                                {row.isNewCategory && row.isValid && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
                                    NEW
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                                {row.name || <span className="text-slate-400 italic">Empty</span>}
                              </td>
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                ${row.price.toFixed(2)}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.isVeg
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {row.isVeg ? 'VEG' : 'NON-VEG'}
                                </span>
                              </td>
                              <td className="p-2.5">
                                {row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <Check className="w-3.5 h-3.5" /> Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium" title={row.error}>
                                    <AlertCircle className="w-3.5 h-3.5" /> {row.error}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Progress Bar during Import */}
                  {isImportingCsv && csvImportProgress && (
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                        <span>Importing dishes to database...</span>
                        <span>
                          {csvImportProgress.current} / {csvImportProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 dark:bg-indigo-900/60 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(csvImportProgress.current / csvImportProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvFile(null);
                  setCsvParsedRows([]);
                  setCsvImportSuccessMsg(null);
                  setError(null);
                }}
                disabled={isImportingCsv}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={
                  !csvFile ||
                  csvParsedRows.filter((r) => r.isValid).length === 0 ||
                  isImportingCsv
                }
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
              >
                {isImportingCsv ? (
                  <span>Importing...</span>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      Import {csvParsedRows.filter((r) => r.isValid).length} Valid Item
                      {csvParsedRows.filter((r) => r.isValid).length === 1 ? '' : 's'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox / Zoom Preview Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPreviewImage}
              alt="Dish Full Size"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            {selectedPreviewImage.includes('firebasestorage') && (
              <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                Stored in Firebase Storage
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
