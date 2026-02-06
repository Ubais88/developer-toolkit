import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

export function ThemeToggle() {
    const { mode, setMode } = useTheme();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="rounded-full w-10 h-10 p-0"
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
            {mode === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500 transition-all duration-300 rotate-0 scale-100" />
            ) : (
                <Moon className="h-5 w-5 text-slate-700 transition-all duration-300 rotate-0 scale-100" />
            )}
        </Button>
    );
}
