import { useRef, useState, type DragEvent } from 'react';
import { ArrowRight, Download, FileSpreadsheet, Sheet, Table2, Trash2, Upload } from 'lucide-react';
import { Button, CopyButton, IconButton, cn } from '../../components/ui';
import { Editor } from '../../components/editor/Editor';
import { useToast } from '../../context/ToastContext';
import { useSessionState } from '../../hooks/useSessionState';
import { binaryStringToBlob, csvToJSON, excelToBinaryString, jsonToCSV } from '../../utils/dataUtils';
import { UtilityCard } from './UtilityCard';

export function Converters({ highlight }: { highlight: string | null }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <ConvertCard
          id="json-csv"
          title="JSON → CSV"
          description="Array of objects to spreadsheet rows"
          icon={<Table2 />}
          inputKey="data-json-to-csv-input"
          outputKey="data-json-to-csv-output"
          inputLang="json"
          outputLang="plaintext"
          placeholder={'[{"name":"Ada","age":36}]'}
          convert={jsonToCSV}
          highlighted={highlight === 'json-csv'}
        />
        <ConvertCard
          id="csv-json"
          title="CSV → JSON"
          description="Quoted fields and commas supported"
          icon={<Sheet />}
          inputKey="data-csv-to-json-input"
          outputKey="data-csv-to-json-output"
          inputLang="plaintext"
          outputLang="json"
          placeholder={'name,age\nAda,36'}
          convert={csvToJSON}
          highlighted={highlight === 'csv-json'}
        />
      </div>
      <ExcelCard highlighted={highlight === 'excel'} />
    </div>
  );
}

interface ConvertCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  inputKey: string;
  outputKey: string;
  inputLang: 'json' | 'plaintext';
  outputLang: 'json' | 'plaintext';
  placeholder: string;
  convert: (s: string) => string;
  highlighted: boolean;
}

function ConvertCard({ id, title, description, icon, inputKey, outputKey, inputLang, outputLang, placeholder, convert, highlighted }: ConvertCardProps) {
  const toast = useToast();
  const [input, setInput] = useSessionState(inputKey, '');
  const [output, setOutput] = useSessionState(outputKey, '');

  const run = () => {
    try {
      setOutput(convert(input));
      toast.success(`Converted ${title}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Conversion failed');
    }
  };

  return (
    <UtilityCard id={id} icon={icon} title={title} description={description} highlighted={highlighted}>
      <div className="h-40 overflow-hidden rounded-md border border-border">
        <Editor value={input} onChange={setInput} language={inputLang} path={`${id}-in`} placeholder={placeholder} lineNumbers={false} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" onClick={run} disabled={!input.trim()}>
          Convert
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        {output && <CopyButton value={output} message="Output copied" label="Copy output" size="xs" />}
      </div>
      <div className="h-40 overflow-hidden rounded-md border border-border">
        <Editor value={output} readOnly language={outputLang} path={`${id}-out`} lineNumbers={false} />
      </div>
    </UtilityCard>
  );
}

function ExcelCard({ highlighted }: { highlighted: boolean }) {
  const toast = useToast();
  const [bytesIn, setBytesIn] = useSessionState('data-excel-binary-input', '');
  const [bytesOut, setBytesOut] = useSessionState('data-excel-binary-output', '');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setBytesOut(await excelToBinaryString(file));
      setFileName(file.name);
      toast.success(`Read ${file.name}`);
    } catch {
      toast.error('Could not read that file');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void readFile(e.dataTransfer.files[0]);
  };

  const download = () => {
    try {
      const url = URL.createObjectURL(binaryStringToBlob(bytesIn));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'converted.xlsx' });
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded converted.xlsx');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Conversion failed');
    }
  };

  const byteCount = bytesOut ? bytesOut.split(',').length : 0;

  return (
    <UtilityCard id="excel" icon={<FileSpreadsheet />} title="Excel ↔ bytes" description="Spreadsheet to byte array and back" highlighted={highlighted}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <span className="label-caps">File → bytes</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'focus-ring flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-xs transition-colors',
              dragging ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-surface-2',
            )}
          >
            <Upload className="h-5 w-5" />
            <span>
              <span className="font-medium text-primary">Choose a file</span> or drop .xlsx / .xls here
            </span>
            {fileName && <span className="font-mono text-2xs text-foreground">{fileName}</span>}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => void readFile(e.target.files?.[0])} />
          <div className="relative h-32 overflow-hidden rounded-md border border-border">
            <Editor value={bytesOut} readOnly language="json" path="excel-bytes-out" lineNumbers={false} />
            {bytesOut && (
              <div className="absolute right-2 top-2 flex gap-1 rounded-md border border-border bg-popover p-0.5 shadow-sm">
                <CopyButton value={bytesOut} message={`${byteCount.toLocaleString()} bytes copied`} />
                <IconButton
                  label="Clear"
                  size="sm"
                  onClick={() => {
                    setBytesOut('');
                    setFileName('');
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                >
                  <Trash2 />
                </IconButton>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="label-caps">Bytes → file</span>
          <div className="min-h-[13.5rem] flex-1 overflow-hidden rounded-md border border-border">
            <Editor value={bytesIn} onChange={setBytesIn} language="plaintext" path="excel-bytes-in" placeholder="[80, 75, 3, 4, …]" lineNumbers={false} />
          </div>
          <Button size="sm" onClick={download} disabled={!bytesIn.trim()}>
            <Download className="h-3.5 w-3.5" />
            Download .xlsx
          </Button>
        </div>
      </div>
    </UtilityCard>
  );
}
