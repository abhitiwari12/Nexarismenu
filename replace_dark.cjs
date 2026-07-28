const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Container
content = content.replace(/className="min-h-screen bg-slate-50 text-slate-900 font-sans"/g, 'className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors"');

// Headings & Text
content = content.replace(/text-slate-900/g, 'text-slate-900 dark:text-white');
content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-slate-200');
content = content.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-300');
content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-400');
content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400'); // merging 500/600 a bit in dark mode for simplicity, or 400/500

// Backgrounds
content = content.replace(/bg-white/g, 'bg-white dark:bg-slate-900');
content = content.replace(/bg-slate-50/g, 'bg-slate-50 dark:bg-slate-950');
content = content.replace(/bg-slate-100\/80/g, 'bg-slate-100/80 dark:bg-slate-900/40');
content = content.replace(/bg-slate-200/g, 'bg-slate-200 dark:bg-slate-800');

// Fix accidental replacements of already dark-enabled classes
content = content.replace(/dark:bg-slate-950 dark:bg-slate-950/g, 'dark:bg-slate-950');
content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
content = content.replace(/dark:text-slate-400 dark:text-slate-400/g, 'dark:text-slate-400');

// Borders
content = content.replace(/border-slate-200\/80/g, 'border-slate-200/80 dark:border-slate-800/80');
content = content.replace(/border-slate-200\/60/g, 'border-slate-200/60 dark:border-slate-800/60');
content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-800');
content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-800');

// Specific badge text
content = content.replace(/text-blue-800/g, 'text-blue-800 dark:text-blue-200');
content = content.replace(/bg-blue-100/g, 'bg-blue-100 dark:bg-blue-900/50');

content = content.replace(/text-emerald-800/g, 'text-emerald-800 dark:text-emerald-200');
content = content.replace(/bg-emerald-100/g, 'bg-emerald-100 dark:bg-emerald-900/50');

content = content.replace(/text-sky-800/g, 'text-sky-800 dark:text-sky-200');
content = content.replace(/bg-sky-100/g, 'bg-sky-100 dark:bg-sky-900/50');

// Hover states
content = content.replace(/hover:bg-slate-100/g, 'hover:bg-slate-100 dark:hover:bg-slate-800');

// Pricing Section tweaks
// "max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-blue-600 shadow-xl relative overflow-hidden" 
// (bg-white dark:bg-slate-900 is handled)

// Feature Cards grid bg-slate-50 -> bg-slate-50 dark:bg-slate-900/50
content = content.replace(/bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl/g, 'bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl');

fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('Replacements complete');
