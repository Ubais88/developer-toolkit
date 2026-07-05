import { useRef, useState } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { 
  Copy, 
  Hash, 
  Clock, 
  FileJson, 
  FileText, 
  ShieldCheck, 
  Link, 
  Lock, 
  Key, 
  FileSpreadsheet, 
  Trash2,
  Code,
  Sparkles
} from 'lucide-react';
import {
  generateUUID,
  timestampToDate,
  dateToTimestamp,
  jsonToCSV,
  csvToJSON,
  escapeString,
  unescapeString,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  decodeJWT,
  generateHash,
  excelToBinaryString,
  binaryStringToBlob,
  htmlEncode,
  htmlDecode,
  convertCase,
  generateLoremIpsum,
  generateCommaSeparated,
} from '../utils/dataUtils';

interface DataUtilitiesProps {
  onCopy: (text: string) => void;
}

type UtilityCategory = 'generators' | 'encoders' | 'converters' | 'text';

export const DataUtilities = ({ onCopy }: DataUtilitiesProps) => {
  // Navigation State
  const [activeCategory, setActiveCategory] = useState<UtilityCategory>('generators');

  // Existing states
  const [uuids, setUuids] = useSessionState<string[]>('data-uuids', []);
  const [timestampInput, setTimestampInput] = useSessionState('data-timestamp-input', '');
  const [timestampOutput, setTimestampOutput] = useSessionState('data-timestamp-output', '');
  const [dateInput, setDateInput] = useSessionState('data-date-input', '');
  const [dateOutput, setDateOutput] = useSessionState('data-date-output', '');
  const [jsonInput, setJsonInput] = useSessionState('data-json-to-csv-input', '');
  const [csvOutput, setCsvOutput] = useSessionState('data-json-to-csv-output', '');
  const [csvInput, setCsvInput] = useSessionState('data-csv-to-json-input', '');
  const [jsonOutput, setJsonOutput] = useSessionState('data-csv-to-json-output', '');
  const [escapeInput, setEscapeInput] = useSessionState('data-escape-input', '');
  const [escapeOutput, setEscapeOutput] = useSessionState('data-escape-output', '');
  const [escapeType, setEscapeType] = useSessionState<'sql' | 'json'>('data-escape-type', 'sql');

  const [base64Input, setBase64Input] = useSessionState('data-base64-input', '');
  const [base64Output, setBase64Output] = useSessionState('data-base64-output', '');
  const [urlInput, setUrlInput] = useSessionState('data-url-input', '');
  const [urlOutput, setUrlOutput] = useSessionState('data-url-output', '');
  const [jwtInput, setJwtInput] = useSessionState('data-jwt-input', '');
  const [jwtOutput, setJwtOutput] = useSessionState('data-jwt-output', '');
  const [hashInput, setHashInput] = useSessionState('data-hash-input', '');
  const [hashOutput, setHashOutput] = useSessionState('data-hash-output', '');
  const [hashAlgo, setHashAlgo] = useSessionState<'SHA-256' | 'SHA-512' | 'SHA-1'>('data-hash-algo', 'SHA-256');

  const [excelBinaryInput, setExcelBinaryInput] = useSessionState('data-excel-binary-input', '');
  const [excelBinaryOutput, setExcelBinaryOutput] = useSessionState('data-excel-binary-output', '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New tool states
  const [htmlInput, setHtmlInput] = useSessionState('data-html-input', '');
  const [htmlOutput, setHtmlOutput] = useSessionState('data-html-output', '');
  const [loremCount, setLoremCount] = useSessionState('data-lorem-count', '3');
  const [loremType, setLoremType] = useSessionState<'paragraphs' | 'sentences' | 'words'>('data-lorem-type', 'paragraphs');
  const [loremOutput, setLoremOutput] = useSessionState('data-lorem-output', '');
  const [caseInput, setCaseInput] = useSessionState('data-case-input', '');
  const [caseOutput, setCaseOutput] = useSessionState('data-case-output', '');
  const [caseType, setCaseType] = useSessionState<'camel' | 'snake' | 'pascal' | 'kebab' | 'upper' | 'lower'>('data-case-type', 'camel');
  
  const [delimInput, setDelimInput] = useSessionState('data-delim-input', '');
  const [delimOutput, setDelimOutput] = useSessionState('data-delim-output', '');
  const [delimQuote, setDelimQuote] = useSessionState<'none' | 'single' | 'double'>('data-delim-quote', 'none');
  const [delimDups, setDelimDups] = useSessionState<boolean>('data-delim-dups', false);
  const [delimTrim, setDelimTrim] = useSessionState<boolean>('data-delim-trim', true);

  // Business Logic Methods
  const handleGenerateUUID = (count: number = 1) => {
    const newUuids = Array.from({ length: count }, () => generateUUID());
    setUuids(newUuids);
  };

  const handleTimestampToDate = () => {
    try {
      const result = timestampToDate(timestampInput);
      setTimestampOutput(result);
    } catch {
      setTimestampOutput('Invalid timestamp');
    }
  };

  const handleDateToTimestamp = () => {
    try {
      const result = dateToTimestamp(dateInput);
      setDateOutput(result.toString());
    } catch {
      setDateOutput('Invalid date');
    }
  };

  const handleJsonToCSV = () => {
    try {
      const result = jsonToCSV(jsonInput);
      setCsvOutput(result);
      onCopy('Converted to CSV');
    } catch (error) {
      onCopy('Conversion failed');
    }
  };

  const handleCSVToJson = () => {
    try {
      const result = csvToJSON(csvInput);
      setJsonOutput(result);
      onCopy('Converted to JSON');
    } catch (error) {
      onCopy('Conversion failed');
    }
  };

  const handleEscape = () => {
    const result = escapeString(escapeInput, escapeType);
    setEscapeOutput(result);
  };

  const handleUnescape = () => {
    const result = unescapeString(escapeInput, escapeType);
    setEscapeOutput(result);
  };

  const handleBase64Encode = () => setBase64Output(base64Encode(base64Input));
  const handleBase64Decode = () => setBase64Output(base64Decode(base64Input));
  
  const handleUrlEncode = () => setUrlOutput(urlEncode(urlInput));
  const handleUrlDecode = () => setUrlOutput(urlDecode(urlInput));

  const handleDecodeJWT = () => setJwtOutput(decodeJWT(jwtInput));

  const handleHash = async () => {
    const hash = await generateHash(hashInput, hashAlgo);
    setHashOutput(hash);
  };

  const handleHtmlEncode = () => setHtmlOutput(htmlEncode(htmlInput));
  const handleHtmlDecode = () => setHtmlOutput(htmlDecode(htmlInput));

  const handleGenerateLorem = () => {
    const count = parseInt(loremCount) || 3;
    setLoremOutput(generateLoremIpsum(count, loremType));
  };

  const handleCaseConvert = () => {
    setCaseOutput(convertCase(caseInput, caseType));
  };

  const handleDelimConvert = () => {
    setDelimOutput(generateCommaSeparated(delimInput, {
      quoteType: delimQuote,
      removeDuplicates: delimDups,
      trimSpaces: delimTrim
    }));
  };

  const handleExcelToBinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const binaryString = await excelToBinaryString(file);
      setExcelBinaryOutput(binaryString);
      onCopy('Converted to Binary');
    } catch (error) {
      onCopy('Conversion failed');
    }
  };

  const handleBinaryToExcel = () => {
    try {
      const blob = binaryStringToBlob(excelBinaryInput);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onCopy('Downloaded Excel file');
    } catch (error) {
      onCopy('Conversion failed');
    }
  };

  const handleClearExcelBinary = () => {
    setExcelBinaryOutput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categories = [
    { id: 'generators', name: 'Generators', icon: Hash, desc: 'UUIDs & cryptographic hashes' },
    { id: 'encoders', name: 'Encoders & Decoders', icon: ShieldCheck, desc: 'Base64, URL & JWT payloads' },
    { id: 'converters', name: 'Format Converters', icon: FileSpreadsheet, desc: 'JSON, CSV & Excel binaries' },
    { id: 'text', name: 'Text & Time Helpers', icon: Clock, desc: 'Escape utilities & timestamps' }
  ] as const;

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Category Sidebar Navigation */}
      <div className="w-64 border-r border-border bg-card/30 flex flex-col p-4 flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Data utilities</h2>
        </div>

        <nav className="flex-1 space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'opacity-80'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{cat.name}</div>
                  <div className="text-[10px] opacity-75 truncate">{cat.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 bg-background/50 overflow-y-auto p-6 space-y-6">
        {/* Category Header */}
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl font-bold capitalize text-foreground">
            {categories.find(c => c.id === activeCategory)?.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {categories.find(c => c.id === activeCategory)?.desc}
          </p>
        </div>

        {/* Dynamic Tool Workspace */}
        {activeCategory === 'generators' && (
          <div className="space-y-6 max-w-4xl">
            {/* UUID Generator */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">UUID Generator</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={() => handleGenerateUUID(1)} variant="primary" size="sm">Generate 1</Button>
                <Button onClick={() => handleGenerateUUID(5)} variant="secondary" size="sm">Generate 5</Button>
                <Button onClick={() => handleGenerateUUID(10)} variant="secondary" size="sm">Generate 10</Button>
                <Button 
                  onClick={() => { if(uuids.length) { navigator.clipboard.writeText(uuids.join('\n')); onCopy('Copied'); } }} 
                  variant="ghost" 
                  size="none"
                  className="px-3 h-8 border border-border text-xs rounded-lg flex items-center gap-1.5"
                  disabled={uuids.length === 0}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy List
                </Button>
              </div>

              {uuids.length > 0 && (
                <div className="bg-muted/30 border border-border rounded-lg p-3 font-mono text-[12px] text-foreground space-y-1.5 max-h-40 overflow-y-auto">
                  {uuids.map((uuid, idx) => (
                    <div key={idx} className="flex justify-between items-center group/item hover:bg-muted/50 px-2 py-0.5 rounded transition-all">
                      <span>{uuid}</span>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(uuid); onCopy('Copied'); }}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
                        title="Copy UUID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hash Generator */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Cryptographic Hash Generator</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <textarea
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    placeholder="Enter text to hash..."
                    className="w-full h-28 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2 items-center">
                    <select 
                      value={hashAlgo} 
                      onChange={(e) => setHashAlgo(e.target.value as any)}
                      className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="SHA-256">SHA-256</option>
                      <option value="SHA-512">SHA-512</option>
                      <option value="SHA-1">SHA-1</option>
                    </select>
                    <Button onClick={handleHash} size="sm" variant="primary">Generate Hash</Button>
                  </div>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 flex flex-col justify-between h-28">
                  <div className="text-xs font-mono break-all overflow-y-auto text-foreground">
                    {hashOutput || <span className="text-muted-foreground italic">Output hash will appear here...</span>}
                  </div>
                  {hashOutput && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(hashOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lorem Ipsum Generator */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Lorem Ipsum Generator</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Type</label>
                      <select 
                        value={loremType} 
                        onChange={(e) => setLoremType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="paragraphs">Paragraphs</option>
                        <option value="sentences">Sentences</option>
                        <option value="words">Words</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Count</label>
                      <input 
                        type="number" 
                        value={loremCount} 
                        onChange={(e) => setLoremCount(e.target.value)}
                        min="1"
                        max="100"
                        className="w-20 px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <Button onClick={handleGenerateLorem} size="sm" variant="primary" className="w-full">Generate Text</Button>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 h-32 flex flex-col justify-between">
                  <div className="text-xs overflow-y-auto text-foreground whitespace-pre-wrap">
                    {loremOutput || <span className="text-muted-foreground italic">Generated placeholder text will appear here...</span>}
                  </div>
                  {loremOutput && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(loremOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'encoders' && (
          <div className="space-y-6 max-w-4xl">
            {/* Base64 */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Base64 Encoder/Decoder</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <textarea
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="Enter plain text or Base64 string..."
                    className="w-full h-28 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleBase64Encode} size="sm" variant="primary">Encode</Button>
                    <Button onClick={handleBase64Decode} size="sm" variant="secondary">Decode</Button>
                  </div>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 h-28 flex flex-col justify-between">
                  <div className="text-xs font-mono overflow-y-auto break-all text-foreground pr-6">
                    {base64Output || <span className="text-muted-foreground italic">Output will appear here...</span>}
                  </div>
                  {base64Output && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(base64Output); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* URL Encode */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">URL Encoder/Decoder</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <textarea
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/search?q=hello world"
                    className="w-full h-28 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleUrlEncode} size="sm" variant="primary">Encode</Button>
                    <Button onClick={handleUrlDecode} size="sm" variant="secondary">Decode</Button>
                  </div>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 h-28 flex flex-col justify-between">
                  <div className="text-xs font-mono overflow-y-auto break-all text-foreground pr-6">
                    {urlOutput || <span className="text-muted-foreground italic">Output will appear here...</span>}
                  </div>
                  {urlOutput && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(urlOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* JWT Decoder */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">JWT Decoder</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <textarea
                    value={jwtInput}
                    onChange={(e) => setJwtInput(e.target.value)}
                    placeholder="Paste your JWT token here (eyJhbGciOi...)"
                    className="w-full h-44 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <Button onClick={handleDecodeJWT} size="sm" variant="primary">Decode Payload</Button>
                </div>

                <div className="h-44 bg-muted/10 border border-border rounded-lg overflow-hidden">
                  <Editor value={jwtOutput} onChange={() => {}} language="json" readOnly className="border-0" />
                </div>
              </div>
            </div>

            {/* HTML Entity Encoder/Decoder */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">HTML Entity Encoder/Decoder</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder="Enter text (e.g. <div>Hello & welcome!</div>)"
                    className="w-full h-28 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleHtmlEncode} size="sm" variant="primary">Encode Entities</Button>
                    <Button onClick={handleHtmlDecode} size="sm" variant="secondary">Decode Entities</Button>
                  </div>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 h-28 flex flex-col justify-between">
                  <div className="text-xs font-mono overflow-y-auto break-all text-foreground pr-6">
                    {htmlOutput || <span className="text-muted-foreground italic">Output will appear here...</span>}
                  </div>
                  {htmlOutput && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(htmlOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'converters' && (
          <div className="space-y-6 max-w-5xl">
            {/* JSON to CSV */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">JSON to CSV Converter</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">JSON Input</label>
                  <div className="h-44 bg-muted/10 border border-border rounded-lg overflow-hidden">
                    <Editor value={jsonInput} onChange={setJsonInput} placeholder='[{"name":"John","age":30}]' language="json" className="border-0" />
                  </div>
                  <Button onClick={handleJsonToCSV} variant="primary" size="sm" className="w-full mt-2">
                    Convert to CSV
                  </Button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">CSV Output</label>
                  <div className="h-44 bg-muted/10 border border-border rounded-lg overflow-hidden">
                    <Editor value={csvOutput} onChange={()=>{}} readOnly language="text" className="border-0" />
                  </div>
                  <Button onClick={() => { if(csvOutput) { navigator.clipboard.writeText(csvOutput); onCopy('Copied'); } }} variant="ghost" size="sm" className="w-full mt-2" disabled={!csvOutput}>
                    <Copy className="w-4 h-4" /> Copy CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* CSV to JSON */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">CSV to JSON Converter</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">CSV Input</label>
                  <div className="h-44 bg-muted/10 border border-border rounded-lg overflow-hidden">
                    <Editor value={csvInput} onChange={setCsvInput} placeholder='name,age&#10;John,30' language="text" className="border-0" />
                  </div>
                  <Button onClick={handleCSVToJson} variant="primary" size="sm" className="w-full mt-2">
                    Convert to JSON
                  </Button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">JSON Output</label>
                  <div className="h-44 bg-muted/10 border border-border rounded-lg overflow-hidden">
                    <Editor value={jsonOutput} onChange={()=>{}} readOnly language="json" className="border-0" />
                  </div>
                  <Button onClick={() => { if(jsonOutput) { navigator.clipboard.writeText(jsonOutput); onCopy('Copied'); } }} variant="ghost" size="sm" className="w-full mt-2" disabled={!jsonOutput}>
                    <Copy className="w-4 h-4" /> Copy JSON
                  </Button>
                </div>
              </div>
            </div>

            {/* Excel Binary Converter */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Excel &lt;-&gt; Binary Converter</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground">Excel File to Binary String</label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="excel-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileSpreadsheet className="w-8 h-8 mb-2 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag spreadsheet</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">XLSX or XLS format</p>
                      </div>
                      <input id="excel-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelToBinary} ref={fileInputRef} />
                    </label>
                  </div>
                  
                  <div className="h-32 bg-muted/10 border border-border rounded-lg overflow-hidden relative">
                    <Editor value={excelBinaryOutput} onChange={()=>{}} readOnly language="json" className="border-0" />
                    {excelBinaryOutput && (
                      <div className="absolute top-2 right-2 flex gap-1.5 z-20">
                        <Button onClick={() => { navigator.clipboard.writeText(excelBinaryOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1 bg-card border border-border rounded hover:bg-muted">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button onClick={handleClearExcelBinary} size="none" variant="ghost" className="p-1 bg-card border border-border text-red-500 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-muted-foreground">Binary String to Excel File</label>
                  <div className="h-[12.3rem] bg-muted/10 border border-border rounded-lg overflow-hidden">
                    <Editor 
                      value={excelBinaryInput} 
                      onChange={setExcelBinaryInput} 
                      placeholder="Enter byte array e.g., 80, 75, 3, 4..." 
                      language="text" 
                      className="border-0" 
                    />
                  </div>
                  <Button onClick={handleBinaryToExcel} variant="primary" size="sm" className="w-full" disabled={!excelBinaryInput}>
                    Convert &amp; Download Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'text' && (
          <div className="space-y-6 max-w-4xl">
            {/* Escape / Unescape */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Escape / Unescape Strings</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground">Escape Standard:</label>
                  <select
                    value={escapeType}
                    onChange={(e) => setEscapeType(e.target.value as 'sql' | 'json')}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="sql">SQL Escape</option>
                    <option value="json">JSON Escape</option>
                  </select>
                </div>
                
                <textarea
                  value={escapeInput}
                  onChange={(e) => setEscapeInput(e.target.value)}
                  placeholder="Enter string content to process..."
                  className="w-full h-24 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                />
                
                <div className="flex gap-2">
                  <Button onClick={handleEscape} variant="primary" size="sm" className="flex-1">Escape</Button>
                  <Button onClick={handleUnescape} variant="secondary" size="sm" className="flex-1">Unescape</Button>
                </div>

                {escapeOutput && (
                  <div className="space-y-2 mt-2 pt-2 border-t border-border">
                    <label className="block text-xs font-semibold text-muted-foreground">Processed Result</label>
                    <div className="relative bg-muted/10 border border-border rounded-lg p-3 min-h-16">
                      <div className="text-xs font-mono break-all text-foreground pr-10">
                        {escapeOutput}
                      </div>
                      <div className="absolute top-2 right-2 z-10">
                        <Button onClick={() => { navigator.clipboard.writeText(escapeOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted bg-card">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Case Converter */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Case Converter</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <textarea
                    value={caseInput}
                    onChange={(e) => setCaseInput(e.target.value)}
                    placeholder="Enter text (e.g. hello_world or helloWorld)..."
                    className="w-full h-24 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2 items-center">
                    <select 
                      value={caseType} 
                      onChange={(e) => setCaseType(e.target.value as any)}
                      className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="camel">camelCase</option>
                      <option value="snake">snake_case</option>
                      <option value="pascal">PascalCase</option>
                      <option value="kebab">kebab-case</option>
                      <option value="upper">UPPERCASE</option>
                      <option value="lower">lowercase</option>
                    </select>
                    <Button onClick={handleCaseConvert} size="sm" variant="primary">Convert</Button>
                  </div>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 h-24 flex flex-col justify-between">
                  <div className="text-xs font-mono overflow-y-auto break-all text-foreground pr-6">
                    {caseOutput || <span className="text-muted-foreground italic">Output text will appear here...</span>}
                  </div>
                  {caseOutput && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(caseOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List Delimiter Formatter */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">List Delimiter Tool (Comma Separated)</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <textarea
                    value={delimInput}
                    onChange={(e) => setDelimInput(e.target.value)}
                    placeholder="Enter list of items (one per line)..."
                    className="w-full h-28 px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-4 text-xs">
                      <label className="flex items-center gap-1 text-muted-foreground">
                        Quote Type:
                        <select 
                          value={delimQuote} 
                          onChange={(e) => setDelimQuote(e.target.value as any)}
                          className="bg-card border border-border rounded-md px-1.5 py-0.5 ml-1"
                        >
                          <option value="none">None</option>
                          <option value="single">Single (')</option>
                          <option value="double">Double (")</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5 text-muted-foreground">
                        <input 
                          type="checkbox" 
                          checked={delimDups} 
                          onChange={(e) => setDelimDups(e.target.checked)}
                          className="rounded border-border text-primary" 
                        />
                        Unique
                      </label>
                      <label className="flex items-center gap-1.5 text-muted-foreground">
                        <input 
                          type="checkbox" 
                          checked={delimTrim} 
                          onChange={(e) => setDelimTrim(e.target.checked)}
                          className="rounded border-border text-primary" 
                        />
                        Trim
                      </label>
                    </div>
                    <Button onClick={handleDelimConvert} size="sm" variant="primary" className="w-full">Format List</Button>
                  </div>
                </div>

                <div className="relative bg-muted/10 border border-border rounded-lg p-3 h-28 flex flex-col justify-between">
                  <div className="text-xs font-mono overflow-y-auto break-all text-foreground pr-6">
                    {delimOutput || <span className="text-muted-foreground italic">Output delimited text will appear here...</span>}
                  </div>
                  {delimOutput && (
                    <div className="absolute top-2 right-2">
                      <Button onClick={() => { navigator.clipboard.writeText(delimOutput); onCopy('Copied'); }} size="none" variant="ghost" className="p-1.5 border border-border rounded-md hover:bg-muted/50 bg-card">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamp Converter */}
            <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Timestamp &amp; Epoch Converter</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-muted-foreground">Epoch Timestamp to Human Date</span>
                  <input
                    type="text"
                    value={timestampInput}
                    onChange={(e) => setTimestampInput(e.target.value)}
                    placeholder="1719878400 (or in milliseconds)"
                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <Button onClick={handleTimestampToDate} variant="primary" size="sm" className="w-full">
                    Convert Epoch
                  </Button>
                  {timestampOutput && (
                    <div className="p-2.5 bg-muted/10 border border-border rounded-lg text-xs text-foreground font-mono break-all mt-2">
                      {timestampOutput}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-muted-foreground">Human Date to Epoch Timestamp</span>
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    placeholder="2026-07-04T12:00:00Z"
                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <Button onClick={handleDateToTimestamp} variant="primary" size="sm" className="w-full">
                    Convert Date
                  </Button>
                  {dateOutput && (
                    <div className="p-2.5 bg-muted/10 border border-border rounded-lg text-xs text-foreground font-mono break-all mt-2">
                      {dateOutput}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
