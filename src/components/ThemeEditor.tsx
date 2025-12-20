import { useTheme } from '../context/ThemeContext';
import { Palette, Moon, Sun, Monitor, Check } from 'lucide-react';

export const ThemeEditor = () => {
  const { mode, setMode, primaryColor, setPrimaryColor, radius, setRadius, preset, applyPreset } = useTheme();

  const colors = [
    { id: 'indigo', name: 'Indigo', class: 'bg-indigo-600' },
    { id: 'blue', name: 'Blue', class: 'bg-blue-600' },
    { id: 'emerald', name: 'Emerald', class: 'bg-emerald-600' },
    { id: 'rose', name: 'Rose', class: 'bg-rose-600' },
    { id: 'orange', name: 'Orange', class: 'bg-orange-600' },
    { id: 'violet', name: 'Violet', class: 'bg-violet-600' },
  ] as const;

  const radii = [
    { id: 'none', name: '0', value: '0px' },
    { id: 'sm', name: '2', value: '2px' },
    { id: 'md', name: '6', value: '6px' },
    { id: 'lg', name: '8', value: '8px' },
    { id: 'full', name: 'Full', value: '99px' },
  ] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Appearance
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Customize the look and feel of the application.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Predefined Styles */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900 dark:text-white">Predefined Styles</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             {[
               { id: 'classic', name: 'Classic', color: 'bg-indigo-600' },
               { id: 'modern', name: 'Modern', color: 'bg-violet-600' },
               { id: 'professional', name: 'Professional', color: 'bg-blue-600' },
               { id: 'vibrant', name: 'Vibrant', color: 'bg-orange-600' },
               { id: 'calm', name: 'Calm', color: 'bg-emerald-600' },
             ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => applyPreset(style.id as any)}
                  className={`relative p-3 rounded-lg border text-left transition-all overflow-hidden group ${
                    preset === style.id
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  }`}
                >
                  <div className={`absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity`}>
                    <div className={`w-16 h-16 rounded-full blur-xl ${style.color} -mr-8 -mt-8`} />
                  </div>
                  <span className="font-medium text-sm relative z-10">{style.name}</span>
                </button>
             ))}
          </div>
        </div>

        {/* Theme Mode */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900 dark:text-white">Theme</label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              onClick={() => setMode('light')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                mode === 'light'
                  ? 'border-primary bg-primary-light text-primary ring-2 ring-primary ring-offset-2'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => setMode('dark')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                mode === 'dark'
                  ? 'border-primary bg-primary-light text-primary ring-2 ring-primary ring-offset-2'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">Dark</span>
            </button>
            <button
              onClick={() => setMode('system')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                mode === 'system'
                  ? 'border-primary bg-primary-light text-primary ring-2 ring-primary ring-offset-2'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </div>

        {/* Primary Color */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900 dark:text-white">Primary Color</label>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => setPrimaryColor(color.id)}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    color.class
                } ${
                  primaryColor === color.id
                    ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-900 dark:ring-white'
                    : 'border-transparent hover:scale-110'
                }`}
                title={color.name}
              >
                {primaryColor === color.id && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900 dark:text-white">Radius</label>
          <div className="flex gap-3">
            {radii.map((r) => (
              <button
                key={r.id}
                onClick={() => setRadius(r.id)}
                className={`px-3 py-2 border rounded-md text-sm font-medium transition-all min-w-[3rem] ${
                  radius === r.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                style={{ borderRadius: r.value }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary-light border border-primary/20 rounded-lg text-sm text-primary">
          This is how your current theme looks like. Buttons, borders, and accents will reflect these choices immediately.
      </div>
    </div>
  );
};
