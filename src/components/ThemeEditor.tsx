import { useTheme } from '../context/ThemeContext';
import { Palette, Moon, Sun, Monitor, Check, Sparkles, Layout, Sliders } from 'lucide-react';

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
    { id: 'none', name: 'None', value: '0px' },
    { id: 'sm', name: '2px', value: '2px' },
    { id: 'md', name: '6px', value: '6px' },
    { id: 'lg', name: '8px', value: '8px' },
    { id: 'xl', name: '12px', value: '12px' },
  ] as const;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-32">
      {/* Title & Desc */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-primary" />
            Appearance Studio
          </h2>
          <p className="text-xs text-muted-foreground">
            Personalize your workspace aesthetics, active base palettes, and glass effects.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 select-none">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Realtime Theme Updates
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns - Controls */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Predefined Styles */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'classic', name: 'Classic', color: 'from-indigo-500 to-indigo-600' },
                { id: 'modern', name: 'Modern', color: 'from-violet-500 to-violet-600' },
                { id: 'professional', name: 'Professional', color: 'from-blue-500 to-blue-600' },
                { id: 'vibrant', name: 'Vibrant', color: 'from-orange-500 to-orange-600' },
                { id: 'calm', name: 'Calm', color: 'from-emerald-500 to-emerald-600' },
                { id: 'cyber', name: 'Cyber', color: 'from-cyan-500 to-cyan-600' },
                { id: 'nature', name: 'Nature', color: 'from-lime-500 to-lime-600' },
                { id: 'candy', name: 'Candy', color: 'from-pink-500 to-pink-600' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => applyPreset(style.id as any)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all overflow-hidden group/btn hover:scale-[1.02] active:scale-[0.98] ${
                    preset === style.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                      : 'border-border bg-card/50 hover:border-muted-foreground/30 hover:bg-card'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-20 group-hover/btn:opacity-40 transition-opacity duration-300">
                    <div className={`w-16 h-16 rounded-full blur-xl bg-gradient-to-tr ${style.color} -mr-8 -mt-8`} />
                  </div>
                  <span className="font-semibold text-xs text-foreground relative z-10">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Theme Mode & Configuration Details */}
          <div className="grid sm:grid-cols-2 gap-6">
            
            {/* Mode & Interface Effects */}
            <div className="space-y-6">
              {/* Theme Mode */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Theme Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', name: 'Light', icon: Sun },
                    { id: 'dark', name: 'Dark', icon: Moon },
                    { id: 'system', name: 'System', icon: Monitor }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isActive = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Glassmorphism Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Interface Effects</label>
                <button
                  onClick={() => setGlass(!glass)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all bg-card/60 ${
                    glass
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className={`text-xs font-bold ${glass ? 'text-primary' : 'text-foreground'}`}>Glassmorphism</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Translucent backdrops &amp; blur filters</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${glass ? 'bg-primary' : 'bg-muted border border-border'}`}>
                    <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200 ${glass ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Corner Radius & Primary Colors */}
            <div className="space-y-6">
              {/* Corner Radius */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Corner Radius</label>
                <div className="flex gap-2 flex-wrap">
                  {radii.map((r) => {
                    const isActive = radius === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRadius(r.id)}
                        className={`flex-1 min-w-[50px] py-2 border text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-primary border-primary text-primary-foreground font-bold shadow-sm'
                            : 'bg-card border-border text-foreground hover:bg-muted/40'
                        }`}
                        style={{ borderRadius: r.value }}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accent Palette</label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((color) => {
                    const isSelected = primaryColor === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setPrimaryColor(color.id as any)}
                        className={`group relative flex aspect-square items-center justify-center rounded-lg border-2 transition-all ${color.class} ${
                          isSelected
                            ? 'border-white dark:border-slate-900 ring-2 ring-offset-2 ring-primary scale-95 shadow'
                            : 'border-transparent hover:scale-105'
                        }`}
                        title={color.name}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-6">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Live Theme Preview</label>
          <div 
            className="bg-card border border-border p-5 shadow-lg flex flex-col gap-4 relative overflow-hidden transition-all duration-300"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {/* Soft decorative background glow */}
            <div className="absolute top-0 right-0 p-1 opacity-20">
              <div className="w-24 h-24 rounded-full blur-3xl bg-primary -mr-12 -mt-12" />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border relative z-10">
              <div className="flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">UbaisToolKit Preview</span>
              </div>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {preset || 'custom'}
              </span>
            </div>
            
            {/* Mock Layout Frame */}
            <div className="border border-border rounded-lg bg-background/50 overflow-hidden flex flex-col h-44 select-none relative z-10">
              {/* Mock Header Row */}
              <div className="h-8 border-b border-border bg-card/60 flex items-center px-2 justify-between">
                <div className="flex items-center gap-1">
                  <div 
                    className="w-10 h-4 border-t-2 border-t-primary bg-background flex items-center justify-center text-[7px] font-bold text-foreground"
                    style={{ borderTopLeftRadius: 'calc(var(--radius) - 2px)', borderTopRightRadius: 'calc(var(--radius) - 2px)' }}
                  >
                    tab-1
                  </div>
                  <div className="w-10 h-4 bg-transparent flex items-center justify-center text-[7px] text-muted-foreground">
                    tab-2
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              
              {/* Mock Editor Body */}
              <div className="flex-1 p-3 flex flex-col justify-between font-mono text-[9px] text-muted-foreground bg-card">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary opacity-60">01</span>
                    <div className="w-2/3 h-1.5 rounded-sm bg-foreground/10" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary opacity-60">02</span>
                    <div className="w-1/2 h-1.5 rounded-sm bg-foreground/10" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary opacity-60">03</span>
                    <div className="w-3/4 h-1.5 rounded-sm bg-foreground/10" />
                  </div>
                </div>
                
                {/* Mock Dialog Button Row */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-10 h-5 bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-sans font-bold shadow-sm"
                      style={{ borderRadius: 'calc(var(--radius) - 3px)' }}
                    >
                      Save
                    </div>
                    <div 
                      className="w-10 h-5 border border-border text-foreground text-[8px] flex items-center justify-center font-sans"
                      style={{ borderRadius: 'calc(var(--radius) - 3px)' }}
                    >
                      Cancel
                    </div>
                  </div>
                  <div className="w-8 h-3.5 rounded-sm bg-emerald-500/10 text-emerald-500 text-[8px] flex items-center justify-center font-bold">
                    ✓ Valid
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Badge */}
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-[11px] text-muted-foreground flex gap-2.5 relative z-10 leading-relaxed">
              <Sliders className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p>
                Accent color is <span className="font-bold text-primary capitalize">{primaryColor}</span>, active corner radius is <span className="font-bold text-foreground">{radius}</span>, utilizing <span className="font-bold text-foreground">{glass ? 'Glassmorphic blur' : 'Solid layout'}</span> filters.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
