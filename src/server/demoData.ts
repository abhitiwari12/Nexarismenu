import { UserRole, UserStatus } from './db';
import bcrypt from 'bcryptjs';

export interface DemoRestaurant {
  user: {
    id: string;
    restaurant_name: string;
    owner_name: string;
    email: string;
    password_hash: string;
    role: UserRole;
    status: UserStatus;
    slug: string;
    phone: string;
    address: string;
    logo_url: string;
    cover_url: string;
  };
  categories: { id: string; name: string }[];
  items: {
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_veg: boolean;
    is_jain?: boolean;
    is_no_onion_garlic?: boolean;
    is_vegan?: boolean;
    is_bestseller?: boolean;
    is_todays_special?: boolean;
    is_available: boolean;
    calories?: number;
    grams?: number;
  }[];
}

export function getDemoRestaurantsData(demoPasswordHash: string): DemoRestaurant[] {
  return [
    // 1. THE VELVET BEAN CAFE & ROASTERY
    {
      user: {
        id: 'u_demo_velvet_bean',
        restaurant_name: 'The Velvet Bean Cafe & Roastery',
        owner_name: 'Aria Sterling',
        email: 'cafe@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'velvet-bean',
        phone: '+1 (555) 123-0199',
        address: '88 Coffee Avenue, Grind District, Seattle, WA 98101',
        logo_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_bean_brews', name: 'Artisanal Brews & Teas' },
        { id: 'c_bean_baked', name: 'Freshly Baked & Pastries' },
        { id: 'c_bean_brunch', name: 'All-Day Brunch' },
        { id: 'c_bean_bowls', name: 'Healthy Bowls & Salads' }
      ],
      items: [
        { id: 'vb1', category_id: 'c_bean_brews', name: 'Classic Espresso Macchiato', description: 'Double shot of our house signature espresso marked with a dollop of velvety milk foam.', price: 4.50, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 15, grams: 60 },
        { id: 'vb2', category_id: 'c_bean_brews', name: 'Iced Spanish Latte', description: 'Double espresso blended with condensed milk, chilled whole milk, and served over ice.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_bestseller: true, is_available: true, calories: 240, grams: 350 },
        { id: 'vb3', category_id: 'c_bean_brews', name: 'Rose Cardamom Cold Brew', description: 'Steeped for 18 hours, infused with organic rose syrup and crushed green cardamom pods.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 80, grams: 300 },
        { id: 'vb4', category_id: 'c_bean_brews', name: 'Iced Ceremonial Matcha Latte', description: 'Uji stone-ground ceremonial green tea whisked fresh with organic oat milk and raw honey.', price: 6.50, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_todays_special: true, is_available: true, calories: 160, grams: 320 },
        { id: 'vb5', category_id: 'c_bean_brews', name: 'Slow-Brewed Ethiopian V60', description: 'Single-origin pour-over displaying vibrant notes of jasmine, lemon zest, and wild blueberries.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 2, grams: 250 },
        { id: 'vb6', category_id: 'c_bean_baked', name: 'Classic Almond Croissant', description: 'Double-baked buttery pastry loaded with rich almond frangipane cream and toasted sliced almonds.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 420, grams: 120 },
        { id: 'vb7', category_id: 'c_bean_baked', name: 'Belgian Dark Chocolate Waffle', description: 'Fluffy malted waffle drizzled with melted 70% Callebaut dark chocolate and dusting sugar.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 510, grams: 180 },
        { id: 'vb8', category_id: 'c_bean_baked', name: 'Double Chocolate Chunk Cookie', description: 'Thick, chewy NYC-style cookie loaded with semi-sweet and white chocolate chunks, sea salt.', price: 3.50, image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 340, grams: 90 },
        { id: 'vb9', category_id: 'c_bean_baked', name: 'Spinach & Cream Feta Puff', description: 'Golden flaky puff pastry envelope stuffed with creamed spinach, Greek feta, and dill.', price: 4.80, image_url: 'https://images.unsplash.com/photo-1549590143-d5855148a9d5?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 280, grams: 110 },
        { id: 'vb10', category_id: 'c_bean_baked', name: 'Vanilla Bean Affogato', description: 'One scoop of premium Madagascar vanilla bean gelato drowned in a double shot of hot espresso.', price: 5.20, image_url: 'https://images.unsplash.com/photo-1594911774802-8822a707cff3?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 190, grams: 100 },
        { id: 'vb11', category_id: 'c_bean_brunch', name: 'Artisanal Sourdough Avocado Toast', description: 'Crushed Hass avocado, heirloom cherry tomatoes, organic microgreens, toasted pumpkin seeds, lemon zest.', price: 12.50, image_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 360, grams: 220 },
        { id: 'vb12', category_id: 'c_bean_brunch', name: 'Truffle Scrambled Eggs on Sourdough', description: 'Three organic pasture-raised eggs scrambled with French butter, shaved black truffles, on sourdough.', price: 14.00, image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 450, grams: 250 },
        { id: 'vb13', category_id: 'c_bean_brunch', name: 'Blueberry Ricotta Fluffy Pancakes', description: 'Three thick, fluffy buttermilk pancakes folded with fresh blueberries and creamy whip ricotta.', price: 13.00, image_url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 580, grams: 280 },
        { id: 'vb14', category_id: 'c_bean_brunch', name: 'Smoked Salmon & Cream Cheese Bagel', description: 'Toasted sesame bagel, Scottish smoked salmon, wild capers, thin red onion rings, herb cream cheese.', price: 15.00, image_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 490, grams: 240 },
        { id: 'vb15', category_id: 'c_bean_brunch', name: 'Garden Veggie Crustless Quiche', description: 'Baked savory custard of eggs, gruyère cheese, zucchini, bell peppers, baby spinach.', price: 11.50, image_url: 'https://images.unsplash.com/photo-1621510456681-23a23cfb5f57?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 310, grams: 180 },
        { id: 'vb16', category_id: 'c_bean_brunch', name: 'Tandoori Paneer Sourdough Melt', description: 'Marinated cottage cheese cubes, bell peppers, mozzarella cheese, mint mayo, melted on rustic bread.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 520, grams: 260 },
        { id: 'vb17', category_id: 'c_bean_bowls', name: 'Acai Berry Superfood Bowl', description: 'Pure organic acai blended with banana, topped with granola, chia seeds, fresh berries, hemp seeds.', price: 11.00, image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 320, grams: 280 },
        { id: 'vb18', category_id: 'c_bean_bowls', name: 'Mediterranean Halloumi Salad', description: 'Pan-seared halloumi cheese, romaine lettuce, cucumber, kalamata olives, cherry tomatoes, lemon-herb glaze.', price: 13.50, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 410, grams: 250 },
        { id: 'vb19', category_id: 'c_bean_bowls', name: 'Maple Roasted Sweet Potato Salad', description: 'Caramelized sweet potatoes, tri-color quinoa, baby kale, toasted walnuts, organic apple cider vinaigrette.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 350, grams: 240 },
        { id: 'vb20', category_id: 'c_bean_bowls', name: 'Hummus & Falafel Buddha Bowl', description: 'House hummus, crispy baked falafels, quinoa, cucumber salad, pickled turnips, tahini drizzle.', price: 12.50, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 460, grams: 320 }
      ]
    },

    // 2. THE GRAND PAVILION AT REGENCY HOTEL
    {
      user: {
        id: 'u_demo_grand_pavilion',
        restaurant_name: 'The Grand Pavilion at Regency Hotel',
        owner_name: 'Chef Julian Henderson',
        email: 'hotel@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'grand-pavilion',
        phone: '+1 (555) 777-8899',
        address: '500 Luxury Parkway, Grand Atrium Lobby, Chicago, IL 60611',
        logo_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_gp_soups', name: 'Elegant Soups & Salads' },
        { id: 'c_gp_continental', name: 'Continental Mains' },
        { id: 'c_gp_indian', name: 'Royal Indian Classics' },
        { id: 'c_gp_desserts', name: 'Regency Dessert Studio' }
      ],
      items: [
        { id: 'gp1', category_id: 'c_gp_soups', name: 'Cream of French Wild Mushroom', description: 'Velvety soup brewed with porcini, cremini, and button mushrooms, finished with white truffle oil.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 190, grams: 220 },
        { id: 'gp2', category_id: 'c_gp_soups', name: 'Classic Chicken Caesar Salad', description: 'Crisp romaine lettuce tossed in house-made anchovy dressing with grilled chicken breast, parmesan, sourdough croutons.', price: 16.00, image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 420, grams: 250 },
        { id: 'gp3', category_id: 'c_gp_soups', name: 'Roasted Heirloom Pumpkin Salad', description: 'Honey-roasted pumpkin chunks, organic goat cheese, toasted pine nuts, spinach leaves, balsamic syrup.', price: 14.50, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 290, grams: 200 },
        { id: 'gp4', category_id: 'c_gp_soups', name: 'Organic Tuscan Minestrone', description: 'Nutritious Italian garden vegetable broth with ditalini pasta, kidney beans, and fresh basil pesto.', price: 11.00, image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 150, grams: 240 },
        { id: 'gp5', category_id: 'c_gp_soups', name: 'Burrata & Tomato Gazpacho', description: 'Chilled Spanish heirloom tomato soup centered with a full creamy Italian buffalo burrata ball, olive dust.', price: 15.00, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 340, grams: 210 },
        { id: 'gp6', category_id: 'c_gp_continental', name: 'Pan-Seared Scottish Salmon', description: 'Crispy skin salmon fillet, served over asparagus spears, parsnip puree, champagne saffron emulsion.', price: 32.00, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 650, grams: 300 },
        { id: 'gp7', category_id: 'c_gp_continental', name: 'Rosemary Butter Angus Ribeye', description: 'Premium 12oz ribeye steak pan-basted with Kerrygold butter, fresh rosemary, served with truffle fries.', price: 42.00, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 890, grams: 450 },
        { id: 'gp8', category_id: 'c_gp_continental', name: 'Slow-Roasted New Zealand Lamb Shank', description: 'Shank braised for 6 hours in rich red wine jus, set on a bed of roasted garlic mashed potatoes.', price: 36.00, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: false, is_todays_special: true, is_available: true, calories: 780, grams: 400 },
        { id: 'gp9', category_id: 'c_gp_continental', name: 'Lobster Thermidor', description: 'Fresh Maine lobster meat cooked in cognac cream, egg yolk, and gruyère, stuffed in shell.', price: 48.00, image_url: 'https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 720, grams: 350 },
        { id: 'gp10', category_id: 'c_gp_continental', name: 'Truffle & Parmesan Mashed Potatoes', description: 'Rich potato puree whipped with heavy cream, white truffle oil, and freshly grated Parmigiano-Reggiano.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 290, grams: 180 },
        { id: 'gp11', category_id: 'c_gp_indian', name: 'Awadhi Murg Dum Biryani', description: 'Aromatic basmati rice cooked on dum layer-by-layer with overnight saffron-marinated tender chicken.', price: 24.00, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 750, grams: 450 },
        { id: 'gp12', category_id: 'c_gp_indian', name: 'Paneer Butter Masala', description: 'Cottage cheese squares cooked in a rich, buttery, velvety tomato gravy with mild Indian spices.', price: 19.50, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 510, grams: 350 },
        { id: 'gp13', category_id: 'c_gp_indian', name: 'Slow-Cooked Dal Bukhara', description: 'Whole black lentils simmered for 24 hours over active charcoal tandoor with churned white butter.', price: 17.00, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 380, grams: 300 },
        { id: 'gp14', category_id: 'c_gp_indian', name: 'Garlic Butter Naan Basket', description: 'Freshly baked leavened flatbread glazed with melted salted butter, crushed garlic, and coriander.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 240, grams: 120 },
        { id: 'gp15', category_id: 'c_gp_indian', name: 'Mughlai Gosht Rogan Josh', description: 'Classic mutton stew cooked with Kashmiri chilies, yogurt, and whole spices in heavy handi.', price: 26.00, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 690, grams: 380 },
        { id: 'gp16', category_id: 'c_gp_indian', name: 'Jain Subz Navratan Korma', description: 'Rich stew of nine select vegetables cooked in a creamy coconut and cashew sauce, no onion/garlic.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 310, grams: 320 },
        { id: 'gp17', category_id: 'c_gp_desserts', name: 'Warm Apple Galette', description: 'Rustic flaky tart topped with caramelized French apples, cinnamon glaze, vanilla bean gelato.', price: 11.00, image_url: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 410, grams: 180 },
        { id: 'gp18', category_id: 'c_gp_desserts', name: 'Royal Saffron Pistachio Kulfi', description: 'Authentic Indian slow-boiled milk ice cream flavored with Kashmiri saffron and crushed pistachios.', price: 8.00, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 210, grams: 120 },
        { id: 'gp19', category_id: 'c_gp_desserts', name: 'Classic New York Cheesecake', description: 'Dense and creamy graham cracker crust cheesecake topped with imported wild strawberry compote.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 540, grams: 150 },
        { id: 'gp20', category_id: 'c_gp_desserts', name: 'Shahi Tukda with Rabri Platter', description: 'Ghee-fried saffron-soaked bread triangles served topped with rich, thick sweetened condensed milk.', price: 10.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 480, grams: 160 }
      ]
    },

    // 3. L'AMBROISIE FRENCH FINE DINING
    {
      user: {
        id: 'u_demo_lambroisie',
        restaurant_name: "L'Ambroisie French Fine Dining",
        owner_name: 'Chef Francois Laurent',
        email: 'finedine@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'lambroisie',
        phone: '+1 (555) 901-2011',
        address: '9 Place des Vosges, Historic Quarter, Boston, MA 02116',
        logo_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_la_starters', name: 'Hors d\'œuvres (Appetizers)' },
        { id: 'c_la_mains', name: 'Plats Principaux (Mains)' },
        { id: 'c_la_cheese', name: 'Fromages & Douceurs' }
      ],
      items: [
        { id: 'la1', category_id: 'c_la_starters', name: 'Escargots de Bourgogne', description: 'Six imported burgundy snails baked in their shells with wild garlic, shallots, and herb butter.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 340, grams: 150 },
        { id: 'la2', category_id: 'c_la_starters', name: 'Heirloom Beetroot Carpaccio', description: 'Paper-thin roasted red and golden beetroots, French goat cheese, wild honeycomb drizzle, toasted walnuts.', price: 15.50, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 180, grams: 140 },
        { id: 'la3', category_id: 'c_la_starters', name: 'Foie Gras de Canard', description: 'Chilled duck liver torchon seasoned with sea salt, served with fresh brioche toast and fig jam.', price: 26.00, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 420, grams: 110 },
        { id: 'la4', category_id: 'c_la_starters', name: 'Truffle Lobster Bisque', description: 'Rich, velvety Maine lobster reduction soup flavored with cognac, finished with creme fraiche.', price: 20.00, image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80', is_veg: false, is_todays_special: true, is_available: true, calories: 290, grams: 220 },
        { id: 'la5', category_id: 'c_la_starters', name: 'Soufflé au Fromage de Chèvre', description: 'Twice-baked airy French goat cheese souffle served with a light walnut and endive side salad.', price: 17.50, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 310, grams: 160 },
        { id: 'la6', category_id: 'c_la_starters', name: 'French Onion Soup Classique', description: 'Caramelized sweet yellow onions simmered in vegetable-herb broth, topped with Gruyere toast.', price: 14.00, image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 260, grams: 240 },
        { id: 'la7', category_id: 'c_la_starters', name: 'Sarthe Valley Duck Terrine', description: 'Rustic pork and duck cold meat loaf with green peppercorns, cornichons, toasted levain.', price: 16.50, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 380, grams: 130 },
        { id: 'la8', category_id: 'c_la_mains', name: 'Coq au Vin Traditionnel', description: 'Organic farm-raised chicken legs slow-braised for 8 hours in Burgundy red wine, lardons, pearl onions.', price: 34.00, image_url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 690, grams: 420 },
        { id: 'la9', category_id: 'c_la_mains', name: 'Beef Bourguignon Grand Mère', description: 'Tender prime short rib chunks simmered in a rich bone gravy with baby carrots and button mushrooms.', price: 38.00, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 820, grams: 450 },
        { id: 'la10', category_id: 'c_la_mains', name: 'Ratatouille de Provence', description: 'Layers of roasted zucchini, aubergine, bell peppers, tomatoes baked in tomato-herb compote.', price: 24.00, image_url: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 210, grams: 350 },
        { id: 'la11', category_id: 'c_la_mains', name: 'Crispy Duck Confit', description: 'Slow salt-cured, fat-poached duck leg roasted to golden perfection, served over baby potatoes.', price: 35.00, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: false, is_todays_special: true, is_available: true, calories: 720, grams: 380 },
        { id: 'la12', category_id: 'c_la_mains', name: 'Dover Sole Meunière', description: 'Whole Dover sole fish pan-roasted in clear noisette butter, finished with fresh lemon and capers.', price: 44.00, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 480, grams: 310 },
        { id: 'la13', category_id: 'c_la_mains', name: 'Herb-Crusted Rack of Lamb', description: 'Provençale herb and dijon mustard-crusted roasted rack of lamb, baby glazed carrots, rosemary jus.', price: 42.00, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 790, grams: 400 },
        { id: 'la14', category_id: 'c_la_mains', name: 'Provencal Garlic Sea Bass', description: 'Pan-seared Chilean sea bass fillet seasoned with thyme, garlic, olive oil, and fresh tomato confit.', price: 39.00, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 410, grams: 280 },
        { id: 'la15', category_id: 'c_la_mains', name: 'Porcini Mushroom Truffle Risotto', description: 'Acquerello aged carnaroli rice simmered with wild dried porcini mushrooms, parmesan, and black truffle shaving.', price: 28.00, image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281216?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 460, grams: 300 },
        { id: 'la16', category_id: 'c_la_cheese', name: 'Artisanal French Cheese Board', description: 'Curated selection of four cheeses: Brie de Meaux, Comté (18m), Roquefort, and Chèvre, with walnuts.', price: 22.00, image_url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 480, grams: 180 },
        { id: 'la17', category_id: 'c_la_cheese', name: 'Classic Vanilla Crème Brûlée', description: 'Rich chilled egg custard infused with real bourbon vanilla beans, topped with brittle burnt sugar crust.', price: 11.50, image_url: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 340, grams: 120 },
        { id: 'la18', category_id: 'c_la_cheese', name: 'Caramelized Tarte Tatin', description: 'Upside-down puff pastry tart of caramelized heritage apples, served with creme d\'Isigny.', price: 12.50, image_url: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 390, grams: 150 },
        { id: 'la19', category_id: 'c_la_cheese', name: 'Warm Chocolate Coulant', description: 'Moist dark chocolate cake with warm flowing liquid cocoa core, served with salted caramel gelato.', price: 13.00, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 460, grams: 140 },
        { id: 'la20', category_id: 'c_la_cheese', name: 'Macaron Degustation Box', description: 'Six assorted hand-painted Parisian macarons (rose, lavender, salted caramel, pistachio, dark cocoa).', price: 15.00, image_url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 290, grams: 90 }
      ]
    },

    // 4. BELLA ITALIA BISTRO
    {
      user: {
        id: 'u_demo_bella_italia',
        restaurant_name: 'Bella Italia Bistro',
        owner_name: 'Marco Rossi',
        email: 'demo@bellaitalia.com',
        password_hash: bcrypt.hashSync('demo123', 10),
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'bella-italia',
        phone: '+91 98765 43210',
        address: '12 Piazza Navona, Little Italy, Portland, OR 97205',
        logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_np_starters', name: 'Antipasti & Greens' },
        { id: 'c_np_pizzas', name: 'Woodfired Pizzas' },
        { id: 'c_np_pastas', name: 'Fresh House Pasta' },
        { id: 'c_np_desserts', name: 'Dolci (Sweets)' }
      ],
      items: [
        { id: 'np1', category_id: 'c_np_starters', name: 'Truffle Garlic Sourdough', description: 'Toasted 48-hour sourdough slices rubbed with roasted garlic, butter, and black truffle oil.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 190, grams: 120 },
        { id: 'np2', category_id: 'c_np_starters', name: 'Caprese Salad Di Bufala', description: 'Imported buffalo mozzarella, sweet vine-ripe heirloom tomatoes, fresh sweet basil, and aged modena balsamic.', price: 11.50, image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 230, grams: 180 },
        { id: 'np3', category_id: 'c_np_starters', name: 'Crispy Garlic Arancini', description: 'Three golden-fried wild mushroom risotto balls stuffed with melted fontina cheese, served with marinara.', price: 9.50, image_url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 310, grams: 150 },
        { id: 'np4', category_id: 'c_np_starters', name: 'Calabrian Meatballs', description: 'House ground beef meatballs baked in fiery Calabrian chili arrabbiata sauce and pecorino cheese.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 420, grams: 220 },
        { id: 'np5', category_id: 'c_np_starters', name: 'Citrus Arugula Salad', description: 'Baby arugula, orange wheels, roasted hazelnuts, shaved pecorino cheese, honey-lime vinaigrette.', price: 10.00, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 160, grams: 150 },
        { id: 'np6', category_id: 'c_np_pizzas', name: 'Classic Neapolitan Margherita', description: 'San Marzano tomatoes, fresh buffalo mozzarella, aromatic sweet basil leaves, organic cold-pressed olive oil.', price: 15.00, image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_bestseller: true, is_available: true, calories: 720, grams: 340 },
        { id: 'np7', category_id: 'c_np_pizzas', name: 'Spicy Hot Honey Pepperoni', description: 'Classic tomato base, cured pepperoni, shredded mozzarella, fresh chili, drizzled with homemade hot chili honey.', price: 17.50, image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 890, grams: 380 },
        { id: 'np8', category_id: 'c_np_pizzas', name: 'Tartufo e Funghi Pizza', description: 'White base (no sauce) of wild forest mushrooms, fresh mozzarella, finished with black truffle pate.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 810, grams: 360 },
        { id: 'np9', category_id: 'c_np_pizzas', name: 'Quattro Formaggi Pizza', description: 'Creamy mozzarella, sharp gorgonzola DOC, mild fontina, and freshly shaved parmigiano-reggiano.', price: 17.00, image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 850, grams: 350 },
        { id: 'np10', category_id: 'c_np_pizzas', name: 'Prosciutto e Burrata Pizza', description: 'San Marzano base topped post-bake with cured Parma prosciutto ham, wild baby arugula, and whole cold burrata.', price: 21.00, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', is_veg: false, is_todays_special: true, is_available: true, calories: 920, grams: 420 },
        { id: 'np11', category_id: 'c_np_pizzas', name: 'Garden Harvest Vegan Pizza', description: 'Red sauce, roasted bell peppers, sliced black olives, sweet corn, zucchini, vegan soy-cheese.', price: 16.00, image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 590, grams: 360 },
        { id: 'np12', category_id: 'c_np_pizzas', name: 'Spicy Diavola Pizza', description: 'San Marzano base, hot Calabrian salami, black olives, mozzarella, hot red chilies.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 880, grams: 370 },
        { id: 'np13', category_id: 'c_np_pizzas', name: 'Smoked BBQ Chicken Pizza', description: 'Barbecue glaze base, hickory-smoked pulled chicken breast, red onions, cilantro, mozzarella.', price: 17.50, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 840, grams: 380 },
        { id: 'np14', category_id: 'c_np_pastas', name: 'Basil Pesto Genovese Penne', description: 'Fresh penne tossed in rich sweet basil and pine nut pesto sauce with grated parmesan cheese.', price: 14.50, image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281216?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 430, grams: 280 },
        { id: 'np15', category_id: 'c_np_pastas', name: 'Classic Beef Bolognese Lasagna', description: 'Layers of fresh egg pasta sheets with slow-cooked beef ragu, creamy bechamel, melted mozzarella.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281216?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 680, grams: 350 },
        { id: 'np16', category_id: 'c_np_pastas', name: 'Spinach & Ricotta Ravioli', description: 'Square pocket pastas stuffed with baby spinach and creamy ricotta, in cherry tomato butter sauce.', price: 16.50, image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 380, grams: 250 },
        { id: 'np17', category_id: 'c_np_pastas', name: 'Fiery Penne Arrabbiata', description: 'Fresh pasta tossed with spicy red chilies, garlic, and rich San Marzano tomato marinara.', price: 13.00, image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281216?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 310, grams: 270 },
        { id: 'np18', category_id: 'c_np_desserts', name: 'Classic Espresso Tiramisu', description: 'Savoiardi ladyfingers soaked in rich dark espresso coffee, topped with heavy whipped mascarpone.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 390, grams: 130 },
        { id: 'np19', category_id: 'c_np_desserts', name: 'Red Raspberry Panna Cotta', description: 'Chilled cooked vanilla bean cream pudding topped with a refreshing tart red raspberry coulis.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 260, grams: 110 },
        { id: 'np20', category_id: 'c_np_desserts', name: 'Limoncello Sorbetto Cup', description: 'Refreshing sweet-and-sour frozen water ice infused with organic Italian lemons and fresh mint.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 95, grams: 100 }
      ]
    },

    // 5. DAKSHIN BHAVAN SOUTH INDIAN
    {
      user: {
        id: 'u_demo_dakshin_bhavan',
        restaurant_name: 'Dakshin Bhavan Authentic South Indian',
        owner_name: 'Venkatesh Iyer',
        email: 'southindian@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'dakshin-bhavan',
        phone: '+1 (555) 362-0900',
        address: '44 Curry Road, Little Madras, Queens, NY 11101',
        logo_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_db_breakfast', name: 'Idli, Vada & Breakfast' },
        { id: 'c_db_dosas', name: 'Gourmet Dosas' },
        { id: 'c_db_curries', name: 'South Traditional Gravies' },
        { id: 'c_db_drinks', name: 'Filter Coffee & Desserts' }
      ],
      items: [
        { id: 'db1', category_id: 'c_db_breakfast', name: 'Steamed Ghee Podi Idli', description: 'Four tiny rice cakes coated generously in pure ghee and spicy gunpowder dry lentil spice.', price: 6.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_bestseller: true, is_available: true, calories: 180, grams: 150 },
        { id: 'db2', category_id: 'c_db_breakfast', name: 'Crispy Medu Vada', description: 'Two crispy golden-fried savory lentil doughnuts served with warm vegetable sambar and coconut chutney.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 210, grams: 130 },
        { id: 'db3', category_id: 'c_db_breakfast', name: 'Ony-Tomato Uttapam', description: 'Thick, fluffy rice-lentil pancake topped with diced tomatoes, onions, fresh coriander, green chilies.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 240, grams: 180 },
        { id: 'db4', category_id: 'c_db_breakfast', name: 'Malabar Vegetable Kurma & Parotta', description: 'Two layered, flaky, soft flatbreads served with a spiced aromatic coconut-based vegetable gravy.', price: 9.50, image_url: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 430, grams: 260 },
        { id: 'db5', category_id: 'c_db_breakfast', name: 'Ragi Wheat Roti with Chutney', description: 'Two flatbreads made of nutritious finger-millet and whole wheat, served with vegan mint chutney.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 150, grams: 110 },
        { id: 'db6', category_id: 'c_db_dosas', name: 'Classic Sambar Masala Dosa', description: 'Large crispy rice crepe stuffed with mashed potato seasoned with turmeric, mustard seeds, and curry leaves.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 310, grams: 220 },
        { id: 'db7', category_id: 'c_db_dosas', name: 'Mysore Ghee Roast Masala Dosa', description: 'Crispy dosa coated internally with spicy garlic-red chili chutney, stuffed with potato masala.', price: 9.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 380, grams: 240 },
        { id: 'db8', category_id: 'c_db_dosas', name: 'Cheese Chilli Spring Dosa', description: 'Thin crepe rolled with grated mozzarella, chopped green chilies, onions, coriander, sliced like rolls.', price: 10.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 420, grams: 210 },
        { id: 'db9', category_id: 'c_db_dosas', name: 'Jain Plain Butter Dosa', description: 'Crispy golden rice crepe prepared with pure salted butter, no potato, onion, or garlic.', price: 7.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 230, grams: 140 },
        { id: 'db10', category_id: 'c_db_dosas', name: 'Rava Onion Crispy Dosa', description: 'Lacy, ultra-crispy crepe made of semolina batter topped with finely chopped onions and peppercorns.', price: 9.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 290, grams: 190 },
        { id: 'db11', category_id: 'c_db_curries', name: 'Chettinad Spicy Chicken Curry', description: 'Aromatic bone-in chicken slow-cooked in highly roasted whole spices, poppy seeds, and fresh coconut.', price: 16.50, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 490, grams: 340 },
        { id: 'db12', category_id: 'c_db_curries', name: 'Malabar Tamarind Fish Curry', description: 'Kingfish steaks simmered in a tangy coconut milk sauce seasoned with sour kokum and curry leaves.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', is_veg: false, is_todays_special: true, is_available: true, calories: 380, grams: 320 },
        { id: 'db13', category_id: 'c_db_curries', name: 'Spicy Andhra Chilli Chicken', description: 'Dry roasted chicken chunks pan-seared with green chilies, ginger-garlic paste, and curry leaves.', price: 14.00, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 450, grams: 240 },
        { id: 'db14', category_id: 'c_db_curries', name: 'Kerala Avial (Mixed Veg Stew)', description: 'Traditional thick mixture of 11 seasonal vegetables, coconut paste, and sour curd, seasoned with coconut oil.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 230, grams: 280 },
        { id: 'db15', category_id: 'c_db_curries', name: 'Tangy Lemon Rice Bowl', description: 'Basmati rice tempered with peanuts, mustard seeds, green chilies, lemon juice, and crispy lentils.', price: 8.00, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 290, grams: 250 },
        { id: 'db16', category_id: 'c_db_curries', name: 'Classic Tempered Curd Rice', description: 'Soft-boiled rice mashed with fresh probiotic yogurt, milk, mustard seeds, curry leaves, ginger.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 210, grams: 240 },
        { id: 'db17', category_id: 'c_db_drinks', name: 'Dakshin Filter Coffee', description: 'Fresh chicory-coffee blend brewed in brass filter, pulled with frothy high-boiled milk.', price: 3.50, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 120, grams: 150 },
        { id: 'db18', category_id: 'c_db_drinks', name: 'Tender Coconut Elaneer Payasam', description: 'Chilled dessert made of sweet reduced milk, condensed cardamom, and tender coconut meat pulp.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 240, grams: 140 },
        { id: 'db19', category_id: 'c_db_drinks', name: 'Ghee Pineapple Kesari Halwa', description: 'Semolina sweet pudding cooked with roasted pineapple tidbits, pure ghee, cashew nuts, and saffron.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 310, grams: 120 },
        { id: 'db20', category_id: 'c_db_drinks', name: 'Traditional South Indian Thali', description: 'Grand meal comprising Rice, Sambar, Rasam, Kara Kuzhambu, Avial, Poriyal, Curd, Appalam, and Sweet Payasam.', price: 15.00, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 780, grams: 500 }
      ]
    },

    // 6. CHARNI ROAD CHAAT PALACE
    {
      user: {
        id: 'u_demo_charni_road',
        restaurant_name: 'Charni Road Chaat Palace',
        owner_name: 'Devendra Mehta',
        email: 'chaat@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'charni-road-chaat',
        phone: '+91 22 2389 4011',
        address: 'Charni Road Chowpatty, Opp Railway Station, Mumbai, MH 400004',
        logo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_cr_chaat', name: 'Chowpatty Cool Chaats' },
        { id: 'c_cr_hot', name: 'Tawa & Hot Savouries' },
        { id: 'c_cr_sweets', name: 'Sweet Sharaf & Drinks' }
      ],
      items: [
        { id: 'cr1', category_id: 'c_cr_chaat', name: 'Premium Special Sev Puri', description: 'Six flat crispy puris topped with boiled potatoes, onions, raw mango, three tangy chutneys, sweet sev.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 230, grams: 140 },
        { id: 'cr2', category_id: 'c_cr_chaat', name: 'Dahi Puri Chatpata', description: 'Six hollow crisp puris stuffed with potatoes, cold whipped sweet yogurt, date-tamarind paste, chili powder.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_bestseller: true, is_available: true, calories: 280, grams: 160 },
        { id: 'cr3', category_id: 'c_cr_chaat', name: 'Pani Puri (Thikha-Meetha)', description: 'Eight crisp puris served with spicy mint-coriander water, sweet tamarind pulp, boiled potato-chana filling.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_vegan: true, is_available: true, calories: 140, grams: 220 },
        { id: 'cr4', category_id: 'c_cr_chaat', name: 'Bombay Chowpatty Bhel Puri', description: 'Puffed rice tossed with sweet onions, raw mango, tomatoes, spicy garlic chutney, coriander leaves.', price: 4.80, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 190, grams: 120 },
        { id: 'cr5', category_id: 'c_cr_chaat', name: 'Royal Raj Kachori', description: 'King-sized crispy puri loaded with sprouts, potatoes, tiny vadas, yogurt, and pomegranate pearls.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 410, grams: 250 },
        { id: 'cr6', category_id: 'c_cr_chaat', name: 'Delhi Style Aloo Tikki Chaat', description: 'Two shallow-fried crisp potato patties served topped with warm spiced chickpea curry and sweet yogurt.', price: 6.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 340, grams: 180 },
        { id: 'cr7', category_id: 'c_cr_chaat', name: 'Paneer Samosa Chaat', description: 'Two broken crispy samosas topped with chickpea masala, coriander-mint sauce, and pomegranate.', price: 6.80, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 380, grams: 190 },
        { id: 'cr8', category_id: 'c_cr_chaat', name: 'Chilled Sweet Dahi Bhalla', description: 'Soft-boiled lentil dumplings soaked in creamy sweet yogurt, flavored with roasted cumin powder.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 210, grams: 160 },
        { id: 'cr9', category_id: 'c_cr_hot', name: 'Special Mumbai Vada Pav', description: 'Two spiced batter-fried potato dumplings stuffed inside sliced soft buns with spicy dry garlic powder.', price: 4.50, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 310, grams: 160 },
        { id: 'cr10', category_id: 'c_cr_hot', name: 'Amul Cheese Pav Bhaji', description: 'Thick mixed vegetable curry mashed on flat tawa with butter, served with two toasted soft breads.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 590, grams: 280 },
        { id: 'cr11', category_id: 'c_cr_hot', name: 'Tandoori Paneer Kathi Roll', description: 'Flaky flatbread roll stuffed with charcoal roasted cheese cubes, bell peppers, mint mayonnaise.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 420, grams: 180 },
        { id: 'cr12', category_id: 'c_cr_hot', name: 'Crispy Onion & Chilli Bhaji', description: 'Sliced onions and hot green chilies dipped in spiced chickpea flour and deep-fried to golden.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 240, grams: 130 },
        { id: 'cr13', category_id: 'c_cr_hot', name: 'Jain Paneer Lifafa Samosa', description: 'Envelope-shaped crispy fried pastries loaded with minced tandoori paneer, no onion/garlic.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 290, grams: 120 },
        { id: 'cr14', category_id: 'c_cr_hot', name: 'Masala Butter Sweet Corn Cup', description: 'Steamed sweet corn kernels tossed with salted table butter, lime juice, and spicy chaat masala.', price: 4.00, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 140, grams: 110 },
        { id: 'cr15', category_id: 'c_cr_hot', name: 'Spicy Masala French Fries', description: 'Crispy cut potatoes tossed in spicy salt seasoning, peri-peri powder, and coriander leaves.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_vegan: true, is_available: true, calories: 310, grams: 150 },
        { id: 'cr16', category_id: 'c_cr_sweets', name: 'Gulab Jamun with Rabri', description: 'Two warm, soft fried milk balls soaked in sweet cardamon syrup, served with cold thickened milk.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 340, grams: 140 },
        { id: 'cr17', category_id: 'c_cr_sweets', name: 'Royal Saffron Raj Bhog Lassi', description: 'Thick, creamy churned sweet yogurt flavored with organic saffron strands, cardamon, and dry fruits.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_bestseller: true, is_available: true, calories: 280, grams: 250 },
        { id: 'cr18', category_id: 'c_cr_sweets', name: 'Desi Moong Dal Halwa', description: 'Rich dessert prepared of split yellow mung beans roasted in heavy ghee, sugar, and almond flakes.', price: 6.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_todays_special: true, is_available: true, calories: 410, grams: 120 },
        { id: 'cr19', category_id: 'c_cr_sweets', name: 'Dry Fruit Rose Falooda', description: 'Sweet rose milk drink with vermicelli noodles, sweet basil seeds, centered with a vanilla scoop.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 360, grams: 300 },
        { id: 'cr20', category_id: 'c_cr_sweets', name: 'Kesar Pista Rabri Cup', description: 'Traditional Indian sweet made of thick, creamy, slow-boiled milk loaded with saffron and green pistachios.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 240, grams: 100 }
      ]
    },

    // 7. GOLDEN DRAGON PAN-ASIAN BISTRO
    {
      user: {
        id: 'u_demo_golden_dragon',
        restaurant_name: 'Golden Dragon Pan-Asian Bistro',
        owner_name: 'Chef Ming Chen',
        email: 'asian@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'golden-dragon',
        phone: '+1 (555) 987-6543',
        address: '88 Chinatown Way, Lantern Quarter, Seattle, WA 98104',
        logo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_gd_starters', name: 'Dim Sums & Starters' },
        { id: 'c_gd_mains', name: 'Main Woks & Curries' },
        { id: 'c_gd_noodles', name: 'Noodles & Fried Rice' },
        { id: 'c_gd_desserts', name: 'Asian Sweet Ends' }
      ],
      items: [
        { id: 'gd1', category_id: 'c_gd_starters', name: 'Crystal Shiitake Dumplings', description: 'Four steamed translucent skins stuffed with chopped shiitake, bamboo shoot, and water chestnut.', price: 9.00, image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_bestseller: true, is_available: true, calories: 150, grams: 120 },
        { id: 'gd2', category_id: 'c_gd_starters', name: 'Chicken & Chive Dim Sum', description: 'Four thin dumplings loaded with minced tender chicken, wild green chives, ginger-soy seasoning.', price: 10.50, image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 210, grams: 130 },
        { id: 'gd3', category_id: 'c_gd_starters', name: 'Edamame & Truffle Oil Gyoza', description: 'Four pan-fried Japanese potstickers stuffed with sweet edamame puree and rich black truffle oil.', price: 11.00, image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 180, grams: 120 },
        { id: 'gd4', category_id: 'c_gd_starters', name: 'Crispy Veg Spring Rolls', description: 'Three golden-fried rolls stuffed with julienned carrot, glass noodles, cabbage, served with sweet plum dip.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 240, grams: 140 },
        { id: 'gd5', category_id: 'c_gd_starters', name: 'Honey Chilli Crispy Lotus Stem', description: 'Crispy sliced lotus root stem tossed in sweet wild honey, hot red chilies, and sesame seeds.', price: 9.50, image_url: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 290, grams: 160 },
        { id: 'gd6', category_id: 'c_gd_starters', name: 'Sichuan Garlic Stir-Fry Prawns', description: 'Eight tiger prawns wok-tossed in fiery Sichuan dry chili oil, green bell peppers, garlic cloves.', price: 16.50, image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 340, grams: 220 },
        { id: 'gd7', category_id: 'c_gd_starters', name: 'Hot & Sour Tofu Soup', description: 'Fiery broth with shredded organic tofu, black wood-ear mushrooms, bamboo shoots, green chili vinegars.', price: 7.00, image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 120, grams: 200 },
        { id: 'gd8', category_id: 'c_gd_starters', name: 'Tom Yum Herb Soup (Veg)', description: 'Classic Thai hot-and-sour lemongrass soup with fresh straw mushrooms, cherry tomatoes, and lime leaves.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 95, grams: 210 },
        { id: 'gd9', category_id: 'c_gd_mains', name: 'Kung Pao Tofu & Peanuts', description: 'Diced soft organic tofu tossed with roasted peanuts, red and yellow bell peppers in sweet-soy sauce.', price: 15.00, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 380, grams: 300 },
        { id: 'gd10', category_id: 'c_gd_mains', name: 'Thai Green Curry with Veggies', description: 'Creamy spicy green curry simmered with bamboo shoot, broccoli, peas, eggplant with jasmine rice bowl.', price: 16.50, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_bestseller: true, is_available: true, calories: 480, grams: 400 },
        { id: 'gd11', category_id: 'c_gd_mains', name: 'Thai Red Curry Chicken', description: 'Creamy sweet-and-spicy coconut red curry with organic chicken breast strips, kaffir lime, jasmine rice.', price: 18.00, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 590, grams: 420 },
        { id: 'gd12', category_id: 'c_gd_mains', name: 'Beijing Golden Roast Duck', description: 'Authentic roasted duck sliced thin, served with hot thin pancakes, sweet hoisin sauce, scallions.', price: 32.00, image_url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80', is_veg: false, is_todays_special: true, is_available: true, calories: 840, grams: 450 },
        { id: 'gd13', category_id: 'c_gd_mains', name: 'Sweet & Sour Fish Fillet', description: 'Crispy skin white fish tossed in tang red sweet-and-sour glaze with bell pepper and pineapples.', price: 19.50, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 410, grams: 280 },
        { id: 'gd14', category_id: 'c_gd_mains', name: 'Stir-Fry Ginger Broccoli Wok', description: 'Fresh crisp broccoli crowns and shiitake mushrooms sautéed in a savory ginger-soy sesame sauce.', price: 14.00, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', is_veg: true, is_vegan: true, is_available: true, calories: 190, grams: 260 },
        { id: 'gd15', category_id: 'c_gd_noodles', name: 'Chilli Garlic Hakka Noodles', description: 'Wok-tossed thin egg noodles with julienned colorful vegetables, spicy red chilies, crushed garlic.', price: 12.50, image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 390, grams: 280 },
        { id: 'gd16', category_id: 'c_gd_noodles', name: 'Golden Egg Fried Rice', description: 'Fluffy long-grain jasmine rice wok-tossed with whisked organic eggs, light soy sauce, green onions.', price: 11.50, image_url: 'https://images.unsplash.com/photo-1603133872878-685f2086ca3e?auto=format&fit=crop&w=600&q=80', is_veg: false, is_available: true, calories: 420, grams: 290 },
        { id: 'gd17', category_id: 'c_gd_noodles', name: 'Sichuan Vegetable Fried Rice', description: 'Basmati rice cooked in hot Sichuan peppercorn sauce, baby corn, green peas, and French beans.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_vegan: true, is_available: true, calories: 350, grams: 300 },
        { id: 'gd18', category_id: 'c_gd_noodles', name: 'Classic Chicken Pad Thai', description: 'Traditional flat rice noodles wok-stirred with chicken, bean sprouts, red tofu, sweet tamarind, peanuts.', price: 15.00, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80', is_veg: false, is_bestseller: true, is_available: true, calories: 580, grams: 320 },
        { id: 'gd19', category_id: 'c_gd_desserts', name: 'Thai Mango Sticky Rice', description: 'Sweet sticky rice infused with warm coconut cream, served centered with fresh sweet mango slices.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 290, grams: 160 },
        { id: 'gd20', category_id: 'c_gd_desserts', name: 'Honey Noodles with Vanilla Gelato', description: 'Crispy fried flat flour ribbons glazed in caramelized honey, served topped with cold vanilla scoop.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 320, grams: 140 }
      ]
    },

    // 8. SWEET SURRENDER DESSERT PARLOR
    {
      user: {
        id: 'u_demo_sweet_surrender',
        restaurant_name: 'Sweet Surrender Dessert Parlor',
        owner_name: 'Isabella Vance',
        email: 'dessert@nexarismenu.online',
        password_hash: demoPasswordHash,
        role: 'restaurant' as UserRole,
        status: 'active' as UserStatus,
        slug: 'sweet-surrender',
        phone: '+1 (555) 432-8811',
        address: '101 Sugar Lane, Chocolate District, New York, NY 10009',
        logo_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=80',
        cover_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80',
      },
      categories: [
        { id: 'c_ss_waffles', name: 'Gourmet Waffles & Crepes' },
        { id: 'c_ss_cakes', name: 'Artisanal Cheesecakes' },
        { id: 'c_ss_gelato', name: 'Hand-Churned Gelatos' }
      ],
      items: [
        { id: 'ss1', category_id: 'c_ss_waffles', name: 'Nutella Banana Waffle', description: 'Warm golden bubble waffle coated with rich Nutella cocoa paste and sliced ripe Cavendish banana.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 490, grams: 180 },
        { id: 'ss2', category_id: 'c_ss_waffles', name: 'Triple Chocolate Overload Waffle', description: 'Dark chocolate batter waffle, glazed with white, milk, and dark fudge sauce, chocolate chips.', price: 9.00, image_url: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 580, grams: 190 },
        { id: 'ss3', category_id: 'c_ss_waffles', name: 'Red Velvet Cream Cheese Waffle', description: 'Red velvet chocolate waffle with sweet whipped dairy cream cheese glaze and red velvet crumbs.', price: 9.50, image_url: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 510, grams: 175 },
        { id: 'ss4', category_id: 'c_ss_waffles', name: 'French Strawberry Nutella Crepe', description: 'Paper-thin warm French wheat crepe stuffed with sliced organic strawberries and rich Nutella fudge.', price: 8.00, image_url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 390, grams: 150 },
        { id: 'ss5', category_id: 'c_ss_waffles', name: 'Classic Sugar Butter Crepe', description: 'Simple Parisian crepe rolled with melted Normandy salted butter and fine organic cane sugar dusting.', price: 6.50, image_url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_available: true, calories: 260, grams: 110 },
        { id: 'ss6', category_id: 'c_ss_cakes', name: 'Classic New York Baked Cheesecake', description: 'Dense, rich and velvety baked cream cheese cake set on a thick buttery graham cracker crumb base.', price: 11.00, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 530, grams: 150 },
        { id: 'ss7', category_id: 'c_ss_cakes', name: 'Wild Blueberry Compote Cheesecake', description: 'Our signature cold-set cream cheese cake topped with thick sweetened organic blue huckleberry sauce.', price: 11.50, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 480, grams: 160 },
        { id: 'ss8', category_id: 'c_ss_cakes', name: 'Lotus Biscoff Speculoos Cheesecake', description: 'Creamy cheesecake layered with Biscoff cookie spread and crushed Belgian cinnamon spiced biscuits.', price: 12.00, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 620, grams: 155 },
        { id: 'ss9', category_id: 'c_ss_cakes', name: 'Tropical Mango Passionfruit Cheesecake', description: 'Fruity summer special cold cheesecake layered with Alphonso mango nectar and tangy passionfruit seeds.', price: 11.50, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 410, grams: 160 },
        { id: 'ss10', category_id: 'c_ss_cakes', name: 'Warm Molten Dark Chocolate Lava', description: 'Dark cocoa cake baked with a solid fudge core that runs liquid chocolate upon cutting, vanilla scoop.', price: 9.50, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', is_veg: true, is_todays_special: true, is_available: true, calories: 460, grams: 130 },
        { id: 'ss11', category_id: 'c_ss_cakes', name: 'S\'mores Fudge Chocolate Brownie', description: 'Thick chewy chocolate cake slice baked with campfire marshmallows, graham crackers, milk fudge.', price: 7.50, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 380, grams: 120 },
        { id: 'ss12', category_id: 'c_ss_cakes', name: 'English Sticky Toffee Pudding', description: 'Soft, moist sponge cake prepared with finely chopped dates, drowned in hot sweet butterscotch sauce.', price: 8.50, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 450, grams: 140 },
        { id: 'ss13', category_id: 'c_ss_cakes', name: 'Matcha White Chocolate Cookie', description: 'Large soft cookie baked of ceremonial Japanese matcha tea green powder and white chocolate buttons.', price: 3.50, image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 310, grams: 85 },
        { id: 'ss14', category_id: 'c_ss_cakes', name: 'Gourmet Salted Caramel Macaron', description: 'Two light crispy almond flour shells filled with buttery dark-cooked sugar caramel and sea salt flakes.', price: 3.00, image_url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 90, grams: 25 },
        { id: 'ss15', category_id: 'c_ss_gelato', name: 'Madagascan Bourbon Vanilla Gelato', description: 'One scoop of premium slow-churned whole milk ice cream enriched with real black vanilla orchid seeds.', price: 5.00, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 150, grams: 90 },
        { id: 'ss16', category_id: 'c_ss_gelato', name: 'Italian Dark Cocoa Sorbetto', description: 'One scoop of water-based dark chocolate ice, extremely rich, dairy-free and vegan friendly.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 110, grams: 90 },
        { id: 'ss17', category_id: 'c_ss_gelato', name: 'Alphonso Mango Organic Sorbet', description: 'One scoop of iced pure Alphonso mango pulp, refreshing sweet and completely vegan.', price: 5.50, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_vegan: true, is_available: true, calories: 90, grams: 90 },
        { id: 'ss18', category_id: 'c_ss_gelato', name: 'Sicilian Green Pistachio Gelato', description: 'One scoop of traditional dense Italian ice cream prepared with genuine roasted green Bronte pistachios.', price: 6.00, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_jain: true, is_no_onion_garlic: true, is_available: true, calories: 190, grams: 90 },
        { id: 'ss19', category_id: 'c_ss_gelato', name: 'The Royal Fudge Hot Sundae', description: 'Two scoops of vanilla and dark chocolate gelatos, loaded with hot milk fudge, chopped peanuts, cherry.', price: 9.00, image_url: 'https://images.unsplash.com/photo-1572246538688-3f326dca3951?auto=format&fit=crop&w=600&q=80', is_veg: true, is_bestseller: true, is_available: true, calories: 480, grams: 220 },
        { id: 'ss20', category_id: 'c_ss_gelato', name: 'Gourmet Cold Tiramisu Jar', description: 'Espresso-soaked cookies layered with cream cheese and coffee powder served in a reusable glass jar.', price: 10.00, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', is_veg: true, is_available: true, calories: 420, grams: 160 }
      ]
    }
  ];
}
