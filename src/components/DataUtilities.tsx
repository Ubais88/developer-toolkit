import { useRef } from 'react';
import { useSessionState } from '../hooks/useSessionState';
import { Editor } from './Editor';
import { Button } from './Button';
import { Copy, Hash, Clock, FileJson, FileText, ShieldCheck, Link, Lock, Key, FileSpreadsheet, Trash2 } from 'lucide-react';
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
} from '../utils/dataUtils';

interface DataUtilitiesProps {
  onCopy: (text: string) => void;
}

const Container = ({ children, title, icon: Icon, colorClass }: any) => (
  <div 
    className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300"
    style={{ borderRadius: 'min(var(--radius), 1.5rem)' }} // Cap radius for large containers to prevent UI breaking
  >
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-5 h-5 ${colorClass}`} />
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
    </div>
    {children}
  </div>
);

export const DataUtilities = ({ onCopy }: DataUtilitiesProps) => {
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

  // New states
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

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 space-y-6">
        {/* UUID */}
        <Container title="UUID Generator" icon={Hash} colorClass="text-primary">
          <div className="flex gap-3 mb-3">
            <Button onClick={() => handleGenerateUUID(1)} variant="primary" size="sm">Generate 1</Button>
            <Button onClick={() => handleGenerateUUID(5)} variant="secondary" size="sm">Generate 5</Button>
            <Button onClick={() => handleGenerateUUID(10)} variant="secondary" size="sm">Generate 10</Button>
            <Button onClick={() => { if(uuids.length) { navigator.clipboard.writeText(uuids.join('\n')); onCopy('Copied'); } }} variant="ghost" size="sm" disabled={uuids.length === 0}>
              <Copy className="w-4 h-4" /> Copy
            </Button>
          </div>
          {uuids.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 border-radius-theme p-3 font-mono text-sm text-slate-700 dark:text-slate-300 space-y-1 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700">
              {uuids.map((uuid, idx) => <div key={idx}>{uuid}</div>)}
            </div>
          )}
        </Container>

        {/* Base64 */}
        <Container title="Base64 Encoder/Decoder" icon={ShieldCheck} colorClass="text-orange-500">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <textarea
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="Input text..."
                    className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                     <Button onClick={handleBase64Encode} size="sm" variant="primary">Encode</Button>
                     <Button onClick={handleBase64Decode} size="sm" variant="secondary">Decode</Button>
                  </div>
               </div>
               <div className="relative">
                  <div className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 font-mono overflow-y-auto break-all">
                    {base64Output}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button onClick={() => { navigator.clipboard.writeText(base64Output); onCopy('Copied'); }} size="sm" variant="ghost" disabled={!base64Output}>
                        <Copy className="w-4 h-4" />
                    </Button>
                  </div>
               </div>
             </div>
        </Container>

        {/* URL Encode */}
        <Container title="URL Encoder/Decoder" icon={Link} colorClass="text-blue-500">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <textarea
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/foo bar"
                    className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                     <Button onClick={handleUrlEncode} size="sm" variant="primary">Encode</Button>
                     <Button onClick={handleUrlDecode} size="sm" variant="secondary">Decode</Button>
                  </div>
               </div>
               <div className="relative">
                  <div className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 font-mono overflow-y-auto break-all">
                    {urlOutput}
                  </div>
               </div>
             </div>
        </Container>

        {/* JWT Decoder */}
        <Container title="JWT Decoder" icon={Key} colorClass="text-purple-500">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <textarea
                    value={jwtInput}
                    onChange={(e) => setJwtInput(e.target.value)}
                    placeholder="eyJhbb..."
                    className="w-full h-40 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                  />
                  <div className="mt-2">
                     <Button onClick={handleDecodeJWT} size="sm" variant="primary">Decode (No Verify)</Button>
                  </div>
               </div>
               <div className="h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden">
                  <Editor value={jwtOutput} onChange={() => {}} language="json" readOnly className="border-0" />
               </div>
             </div>
        </Container>

         {/* Hasher */}
         <Container title="Hash Generator" icon={Lock} colorClass="text-red-500">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <textarea
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    placeholder="Enter text to hash..."
                    className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                  />
                  <div className="flex gap-2 mt-2 items-center">
                     <select 
                        value={hashAlgo} 
                        onChange={(e) => setHashAlgo(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                     >
                        <option value="SHA-256">SHA-256</option>
                        <option value="SHA-512">SHA-512</option>
                        <option value="SHA-1">SHA-1</option>
                     </select>
                     <Button onClick={handleHash} size="sm" variant="primary">Generate Hash</Button>
                  </div>
               </div>
               <div className="relative">
                  <div className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 font-mono overflow-y-auto break-all">
                    {hashOutput}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button onClick={() => { navigator.clipboard.writeText(hashOutput); onCopy('Copied'); }} size="sm" variant="ghost" disabled={!hashOutput}>
                        <Copy className="w-4 h-4" />
                    </Button>
                  </div>
               </div>
             </div>
        </Container>

        <Container title="Timestamp Converter" icon={Clock} colorClass="text-emerald-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">Timestamp to Date</label>
              <input
                type="text"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <Button onClick={handleTimestampToDate} variant="primary" size="sm" className="w-full mt-2">
                Convert
              </Button>
              {timestampOutput && (
                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 border-radius-theme text-xs text-slate-700 dark:text-slate-300 font-mono break-all border border-slate-200 dark:border-slate-700">
                  {timestampOutput}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">Date to Timestamp</label>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                placeholder="2024-01-01T00:00:00Z"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <Button onClick={handleDateToTimestamp} variant="primary" size="sm" className="w-full mt-2">
                Convert
              </Button>
              {dateOutput && (
                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 border-radius-theme text-xs text-slate-700 dark:text-slate-300 font-mono break-all border border-slate-200 dark:border-slate-700">
                  {dateOutput}
                </div>
              )}
            </div>
          </div>
        </Container>

        <Container title="JSON to CSV Converter" icon={FileJson} colorClass="text-yellow-500">
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">JSON Input</label>
              <div className="h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden">
                <Editor value={jsonInput} onChange={setJsonInput} placeholder='[{"name":"John","age":30}]' language="json" className="border-0" />
              </div>
              <Button onClick={handleJsonToCSV} variant="primary" size="sm" className="w-full mt-2">
                Convert to CSV
              </Button>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">CSV Output</label>
               <div className="h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden">
                <Editor value={csvOutput} onChange={()=>{}} readOnly language="text" className="border-0" />
               </div>
               <Button onClick={() => { if(csvOutput) { navigator.clipboard.writeText(csvOutput); onCopy('Copied'); } }} variant="ghost" size="sm" className="w-full mt-2" disabled={!csvOutput}>
                <Copy className="w-4 h-4" /> Copy
              </Button>
            </div>
           </div>
        </Container>

        <Container title="CSV to JSON Converter" icon={FileText} colorClass="text-indigo-500">
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">CSV Input</label>
              <div className="h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden">
                <Editor value={csvInput} onChange={setCsvInput} placeholder='name,age&#10;John,30' language="text" className="border-0" />
              </div>
              <Button onClick={handleCSVToJson} variant="primary" size="sm" className="w-full mt-2">
                Convert to JSON
              </Button>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">JSON Output</label>
               <div className="h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden">
                <Editor value={jsonOutput} onChange={()=>{}} readOnly language="json" className="border-0" />
               </div>
               <Button onClick={() => { if(jsonOutput) { navigator.clipboard.writeText(jsonOutput); onCopy('Copied'); } }} variant="ghost" size="sm" className="w-full mt-2" disabled={!jsonOutput}>
                <Copy className="w-4 h-4" /> Copy
              </Button>
            </div>
           </div>
        </Container>

        <Container title="Escape / Unescape Strings" icon={ShieldCheck} colorClass="text-pink-500">
             <div className="space-y-3">
               <div>
                  <label className="block text-sm text-slate-500 mb-2">Escape type</label>
                  <select
                    value={escapeType}
                    onChange={(e) => setEscapeType(e.target.value as 'sql' | 'json')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                  </select>
               </div>
               <div>
                  <textarea
                    value={escapeInput}
                    onChange={(e) => setEscapeInput(e.target.value)}
                    placeholder="Enter text to escape/unescape..."
                    className="w-full h-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                  />
               </div>
               <div className="flex gap-2">
                 <Button onClick={handleEscape} variant="primary" size="sm" className="flex-1">Escape</Button>
                 <Button onClick={handleUnescape} variant="secondary" size="sm" className="flex-1">Unescape</Button>
               </div>
               {escapeOutput && (
                 <div>
                   <label className="block text-sm text-slate-500 mb-2">Output</label>
                   <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme text-sm text-slate-900 dark:text-slate-100 font-mono break-all">
                     {escapeOutput}
                   </div>
                   <Button onClick={() => { navigator.clipboard.writeText(escapeOutput); onCopy('Copied'); }} variant="ghost" size="sm" className="w-full mt-2">
                      <Copy className="w-4 h-4" /> Copy
                   </Button>
                 </div>
               )}
             </div>
        </Container>

        <Container title="Excel <-> Binary Converter" icon={FileSpreadsheet} colorClass="text-green-600">
           <div className="grid grid-cols-2 gap-4">
             {/* Excel to Binary */}
             <div>
                <label className="block text-sm text-slate-500 mb-2">Excel File to Binary</label>
                <div className="flex items-center justify-center w-full mb-2">
                    <label htmlFor="excel-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileSpreadsheet className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span></p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">XLSX or XLS</p>
                        </div>
                        <input id="excel-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelToBinary} ref={fileInputRef} />
                    </label>
                </div>
                <div className="h-40 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden relative">
                   <Editor value={excelBinaryOutput} onChange={()=>{}} readOnly language="json" className="border-0" />
                   {excelBinaryOutput && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button onClick={() => { navigator.clipboard.writeText(excelBinaryOutput); onCopy('Copied'); }} size="sm" variant="ghost">
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleClearExcelBinary} size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                   )}
                </div>
             </div>

             {/* Binary to Excel */}
             <div>
                <label className="block text-sm text-slate-500 mb-2">Binary String to Excel</label>
                <div className="h-[19.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-radius-theme overflow-hidden mb-2">
                    <Editor 
                        value={excelBinaryInput} 
                        onChange={setExcelBinaryInput} 
                        placeholder="80, 75, 3, 4..." 
                        language="text" 
                        className="border-0" 
                    />
                </div>
                 <Button onClick={handleBinaryToExcel} variant="primary" size="sm" className="w-full" disabled={!excelBinaryInput}>
                   Download Excel
                 </Button>
             </div>
           </div>
        </Container>

    </div>
  );
};
