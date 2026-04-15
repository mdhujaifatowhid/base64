import { useState, useCallback, useRef, DragEvent, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Copy, Download, Trash2, FileCode, RefreshCw, Lock, Unlock, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CryptoJS from 'crypto-js';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rawBase64, setRawBase64] = useState<string>("");
  const [displayBase64, setDisplayBase64] = useState<string>("");
  const [inputBase64, setInputBase64] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Settings
  const [includePrefix, setIncludePrefix] = useState(true);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Encryption for Output
  useEffect(() => {
    if (!rawBase64) {
      setDisplayBase64("");
      return;
    }

    let textToProcess = includePrefix ? rawBase64 : rawBase64.split(',')[1] || rawBase64;

    if (isEncryptionEnabled && password) {
      try {
        const encrypted = CryptoJS.AES.encrypt(textToProcess, password).toString();
        setDisplayBase64(`B64ENC:${encrypted}`);
      } catch (e) {
        setDisplayBase64("Encryption Error");
      }
    } else {
      setDisplayBase64(textToProcess);
    }
  }, [rawBase64, isEncryptionEnabled, password, includePrefix]);

  // Image to Base64 Logic
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const clearImage = () => {
    setImageFile(null);
    setRawBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Base64 to Image Logic (with Decryption)
  const handleBase64Input = useCallback((value: string, pass: string) => {
    setInputBase64(value);
    if (value.trim() === "") {
      setPreviewUrl("");
      return;
    }

    let processedValue = value.trim();

    // Check if it's our custom encrypted format
    if (processedValue.startsWith('B64ENC:')) {
      if (!pass) {
        setPreviewUrl(""); // Need password
        return;
      }
      try {
        const encryptedData = processedValue.replace('B64ENC:', '');
        const bytes = CryptoJS.AES.decrypt(encryptedData, pass);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decrypted) {
          setPreviewUrl("");
          return;
        }
        processedValue = decrypted;
      } catch (e) {
        setPreviewUrl("");
        return;
      }
    }

    // Format for preview
    if (!processedValue.startsWith('data:image/')) {
      processedValue = `data:image/png;base64,${processedValue}`;
    }
    setPreviewUrl(processedValue);
  }, []);

  const downloadImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `converted-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image download started!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/20 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[1100px] min-h-[800px] grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-5">
        
        {/* Header Card */}
        <header className="bento-card col-span-12 flex justify-between items-center py-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter uppercase">B64.io</h1>
            <p className="text-sm text-muted-foreground font-medium">Instant Offline Image Translation & Encryption</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
            <Lock className="w-3 h-3" />
            AES-256 Encryption Ready
          </div>
        </header>

        {/* Main Content Area */}
        <div className="col-span-12">
          <Tabs defaultValue="to-base64" className="w-full h-full flex flex-col gap-5">
            <div className="flex justify-center">
              <TabsList className="inline-flex bg-white border-2 border-border p-1 rounded-xl shadow-[2px_2px_0px_var(--border)]">
                <TabsTrigger value="to-base64" className="px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">
                  Image to Base64
                </TabsTrigger>
                <TabsTrigger value="from-base64" className="px-6 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">
                  Base64 to Image
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="to-base64" className="mt-0 h-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-12 grid-rows-10 gap-5 h-full"
                >
                  {/* Upload Card */}
                  <section className="bento-card col-span-12 lg:col-span-5 row-span-10 lg:row-span-7 flex flex-col items-center justify-center text-center border-dashed bg-muted/20">
                    <span className="bento-label absolute top-6 left-6">Source Image</span>
                    <div
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-4 cursor-pointer group"
                    >
                      <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0]!)} />
                      <div className="w-16 h-16 border-2 border-border rounded-2xl flex items-center justify-center bg-white shadow-[4px_4px_0px_var(--border)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-extrabold text-lg tracking-tight">Drop image here</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">PNG, JPG, WebP up to 10MB</p>
                      </div>
                      <Button variant="outline" className="bento-button mt-2">Browse Files</Button>
                    </div>
                  </section>

                  {/* Output Card */}
                  <section className="bento-card col-span-12 lg:col-span-7 row-span-10 lg:row-span-7 flex flex-col relative">
                    <span className="bento-label">Base64 String Output {isEncryptionEnabled && " (Encrypted)"}</span>
                    <div className={`flex-1 rounded-xl border-2 border-border p-4 font-mono text-[10px] leading-relaxed break-all overflow-y-auto max-h-[400px] transition-colors ${isEncryptionEnabled ? 'bg-blue-50/50' : 'bg-muted/30'}`}>
                      {displayBase64 || "Encoded string will appear here..."}
                    </div>
                    {displayBase64 && (
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => copyToClipboard(displayBase64)} className="bento-button">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy String
                        </Button>
                      </div>
                    )}
                  </section>

                  {/* Settings Card */}
                  <section className="bento-card col-span-12 lg:col-span-4 row-span-10 lg:row-span-3">
                    <span className="bento-label">Format Settings</span>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">Data URI Prefix</span>
                        <button 
                          onClick={() => setIncludePrefix(!includePrefix)}
                          className={`w-10 h-5 rounded-full border-2 border-border relative transition-colors ${includePrefix ? 'bg-accent' : 'bg-muted'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white border border-border rounded-full transition-all ${includePrefix ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          Encryption 
                          {isEncryptionEnabled ? <Lock className="w-3 h-3 text-blue-600" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
                        </span>
                        <button 
                          onClick={() => setIsEncryptionEnabled(!isEncryptionEnabled)}
                          className={`w-10 h-5 rounded-full border-2 border-border relative transition-colors ${isEncryptionEnabled ? 'bg-blue-600' : 'bg-muted'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white border border-border rounded-full transition-all ${isEncryptionEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {isEncryptionEnabled && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <Input 
                            type="password" 
                            placeholder="Set Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-8 text-xs border-2 border-border focus-visible:ring-0 focus-visible:border-blue-600"
                          />
                        </motion.div>
                      )}
                    </div>
                  </section>

                  {/* Preview Card */}
                  <section className="bento-card col-span-12 lg:col-span-4 row-span-10 lg:row-span-3 flex items-center justify-center bg-muted/10">
                    <span className="bento-label absolute top-6 left-6">Quick Preview</span>
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-24 rounded-lg border-2 border-border shadow-[2px_2px_0px_var(--border)]" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center opacity-30">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-[10px] font-bold uppercase">No Input</p>
                      </div>
                    )}
                  </section>

                  {/* Info Card */}
                  <section className="bento-card col-span-12 lg:col-span-4 row-span-10 lg:row-span-3">
                    <span className="bento-label">File Stats</span>
                    {imageFile ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold">Size:</span>
                          <span className="font-mono">{(imageFile.size / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold">Type:</span>
                          <span className="font-mono">{imageFile.type.split('/')[1].toUpperCase()}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearImage} className="w-full mt-2 text-destructive hover:bg-destructive/10 h-7 text-[10px] font-bold uppercase">
                          <Trash2 className="w-3 h-3 mr-1" /> Clear
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Waiting for file...</p>
                    )}
                  </section>
                </motion.div>
              </TabsContent>

              <TabsContent value="from-base64" className="mt-0 h-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-12 grid-rows-10 gap-5 h-full"
                >
                  {/* Input Card */}
                  <section className="bento-card col-span-12 lg:col-span-7 row-span-10 lg:row-span-7 flex flex-col">
                    <span className="bento-label">Paste Base64 String</span>
                    <Textarea
                      value={inputBase64}
                      onChange={(e) => handleBase64Input(e.target.value, decryptPassword)}
                      placeholder="data:image/png;base64,... or B64ENC:..."
                      className="flex-1 font-mono text-[10px] leading-relaxed resize-none bg-muted/10 border-2 border-border focus-visible:ring-0 focus-visible:border-accent rounded-xl"
                    />
                    <div className="mt-4 space-y-3">
                      {inputBase64.startsWith('B64ENC:') && (
                        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl border-2 border-blue-200">
                          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                          <Input 
                            type="password" 
                            placeholder="Enter Decryption Password" 
                            value={decryptPassword}
                            onChange={(e) => {
                              setDecryptPassword(e.target.value);
                              handleBase64Input(inputBase64, e.target.value);
                            }}
                            className="h-9 border-2 border-blue-300 focus-visible:ring-0 focus-visible:border-blue-600 bg-white"
                          />
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-10 font-bold text-xs uppercase border-2 border-border" onClick={() => { setInputBase64(""); setPreviewUrl(""); }}>Clear</Button>
                        <Button variant="outline" className="flex-1 h-10 font-bold text-xs uppercase border-2 border-border" onClick={async () => {
                          const text = await navigator.clipboard.readText();
                          handleBase64Input(text, decryptPassword);
                        }}>Paste</Button>
                      </div>
                    </div>
                  </section>

                  {/* Preview Result Card */}
                  <section className="bento-card col-span-12 lg:col-span-5 row-span-10 lg:row-span-7 flex flex-col items-center justify-center bg-muted/20 border-dashed">
                    <span className="bento-label absolute top-6 left-6">Result Preview</span>
                    {previewUrl ? (
                      <div className="flex flex-col items-center gap-6">
                        <img src={previewUrl} alt="Result" className="max-h-64 rounded-xl border-2 border-border shadow-[4px_4px_0px_var(--border)]" referrerPolicy="no-referrer" />
                        <Button onClick={downloadImage} className="bento-button w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Image
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        {inputBase64.startsWith('B64ENC:') && !decryptPassword ? (
                          <div className="opacity-50">
                            <Lock className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                            <p className="font-extrabold text-lg tracking-tight">Password Required</p>
                            <p className="text-xs text-muted-foreground uppercase font-bold mt-1">Encrypted Content Detected</p>
                          </div>
                        ) : inputBase64.startsWith('B64ENC:') && decryptPassword && !previewUrl ? (
                          <div className="text-destructive">
                            <ShieldAlert className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-extrabold text-lg tracking-tight">Decryption Failed</p>
                            <p className="text-xs uppercase font-bold mt-1">Invalid Password or Data</p>
                          </div>
                        ) : (
                          <div className="opacity-30">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-extrabold text-lg tracking-tight">Waiting for input</p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Encryption Info Card */}
                  <section className="bento-card col-span-12 lg:col-span-4 row-span-10 lg:row-span-3">
                    <span className="bento-label">Encryption Standard</span>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-600">
                      <ShieldCheck className="w-3 h-3" />
                      AES-256 (CBC)
                    </div>
                    <p className="text-[9px] mt-2 text-muted-foreground leading-relaxed">
                      Industry-standard encryption. Your password is never stored or sent anywhere.
                    </p>
                  </section>

                  {/* Security Card */}
                  <section className="bento-card col-span-12 lg:col-span-4 row-span-10 lg:row-span-3">
                    <span className="bento-label">Privacy First</span>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      Zero-Knowledge
                    </div>
                    <p className="text-[9px] mt-2 text-muted-foreground">The app has no memory of your passwords or files once the tab is closed.</p>
                  </section>

                  {/* Tips Card */}
                  <section className="bento-card col-span-12 lg:col-span-4 row-span-10 lg:row-span-3">
                    <span className="bento-label">Encrypted Sharing</span>
                    <p className="text-[10px] font-medium italic">
                      "Encrypted strings start with 'B64ENC:'. Share these with a friend and give them the password separately for secure image transfer."
                    </p>
                  </section>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="col-span-12 text-center py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            © {new Date().getFullYear()} B64.io • Secure Offline Image Utility
          </p>
        </footer>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
