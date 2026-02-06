import { useTheme } from '../context/ThemeContext';
import { Palette, Moon, Sun, Monitor, Check } from 'lucide-react';

export const ThemeEditor = () => {
  const { mode, setMode, primaryColor, setPrimaryColor, radius, setRadius, glass, setGlass, preset, applyPreset } = useTheme();

  const colors = [
    { id: 'indigo', name: 'Indigo', class: 'bg-indigo-600' },
    { id: 'blue', name: 'Blue', class: 'bg-blue-600' },
    { id: 'sky', name: 'Sky', class: 'bg-sky-600' },
    { id: 'cyan', name: 'Cyan', class: 'bg-cyan-600' },
    { id: 'teal', name: 'Teal', class: 'bg-teal-600' },
    { id: 'emerald', name: 'Emerald', class: 'bg-emerald-600' },
    { id: 'lime', name: 'Lime', class: 'bg-lime-600' },
    { id: 'orange', name: 'Orange', class: 'bg-orange-600' },
    { id: 'rose', name: 'Rose', class: 'bg-rose-600' },
    { id: 'pink', name: 'Pink', class: 'bg-pink-600' },
    { id: 'fuchsia', name: 'Fuchsia', class: 'bg-fuchsia-600' },
    { id: 'violet', name: 'Violet', class: 'bg-violet-600' },
  ] as const;

  const radii = [
    { id: 'none', name: '0', value: '0px' },
    { id: 'sm', name: '2', value: '2px' },
    { id: 'md', name: '6', value: '6px' },
    { id: 'lg', name: '8', value: '8px' },
    { id: 'xl', name: '12', value: '12px' },
  ] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-32">
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
        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-900 dark:text-white">Predefined Styles</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'classic', name: 'Classic', color: 'bg-indigo-600' },
              { id: 'modern', name: 'Modern', color: 'bg-violet-600' },
              { id: 'professional', name: 'Professional', color: 'bg-blue-600' },
              { id: 'vibrant', name: 'Vibrant', color: 'bg-orange-600' },
              { id: 'calm', name: 'Calm', color: 'bg-emerald-600' },
              { id: 'cyber', name: 'Cyber', color: 'bg-cyan-600' },
              { id: 'nature', name: 'Nature', color: 'bg-lime-600' },
              { id: 'candy', name: 'Candy', color: 'bg-pink-600' },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => applyPreset(style.id as any)}
                className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${preset === style.id
                  ? 'border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 bg-white dark:bg-slate-900/50'
                  }`}
              >
                <div className={`absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity duration-300`}>
                  <div className={`w-20 h-20 rounded-full blur-2xl ${style.color} -mr-10 -mt-10`} />
                </div>
                <span className="font-medium text-sm relative z-10">{style.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-800" />

        {/* Customization Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Theme & Glass */}
          <div className="space-y-6">
            {/* Mode */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-900 dark:text-white">Theme Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setMode('light')} className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${mode === 'light' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Sun className="w-4 h-4" /> <span className="text-sm">Light</span>
                </button>
                <button onClick={() => setMode('dark')} className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${mode === 'dark' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Moon className="w-4 h-4" /> <span className="text-sm">Dark</span>
                </button>
                <button onClick={() => setMode('system')} className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${mode === 'system' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Monitor className="w-4 h-4" /> <span className="text-sm">System</span>
                </button>
              </div>
            </div>

            {/* Glass Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900 dark:text-white">Interface Effects</label>
              </div>
              <button
                onClick={() => setGlass(!glass)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${glass
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-700'
                  }`}
              >
                <div className="flex flex-col text-left">
                  <span className={`text-sm font-medium ${glass ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>Glassmorphism</span>
                  <span className="text-xs text-slate-500">Translucent backgrounds and blur effects</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${glass ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${glass ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </div>

            {/* Radius */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-900 dark:text-white">Corner Radius</label>
              <div className="flex gap-3">
                {radii.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRadius(r.id)}
                    className={`flex-1 py-2 border text-sm font-medium transition-all ${radius === r.id
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

          {/* Colors */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-900 dark:text-white">Primary Color</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setPrimaryColor(color.id as any)}
                  className={`group relative flex aspect-square items-center justify-center rounded-xl border-2 transition-all ${color.class
                    } ${primaryColor === color.id
                      ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-100'
                      : 'border-transparent hover:scale-105 hover:shadow-md'
                    }`}
                  title={color.name}
                >
                  {primaryColor === color.id && (
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 mt-6 bg-primary/5 border border-primary/20 rounded-xl text-sm text-slate-600 dark:text-slate-300 flex gap-3">
              <div className="w-1 h-full bg-primary rounded-full flex-shrink-0"></div>
              <p>
                Current theme uses <span className="font-bold text-primary capitalize">{primaryColor}</span> with <span className="font-bold">{glass ? 'Glass' : 'Solid'}</span> effects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
