import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Code, Scan } from "lucide-react";
import { motion } from "framer-motion";

export default function CodeInput({ onScanStart }) {
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [inputMode, setInputMode] = useState('paste'); // 'paste' or 'upload'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target.result);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleScan = () => {
    if (code.trim()) {
      onScanStart({
        code,
        fileName: file ? file.name : 'Manual Input'
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/20 overflow-hidden">
      <div className="p-8">
        {/* Mode Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={inputMode === 'paste' ? 'default' : 'outline'}
            onClick={() => setInputMode('paste')}
            className={inputMode === 'paste' 
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold' 
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Code className="w-4 h-4 mr-2" />
            Paste Code
          </Button>
          <Button
            variant={inputMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setInputMode('upload')}
            className={inputMode === 'upload' 
              ? 'bg-cyan-500 hover:bg-cyan-600 text-black font-semibold' 
              : 'border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50'}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>

        {/* Input Area */}
        {inputMode === 'paste' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here for security analysis..."
              className="min-h-[300px] bg-slate-950 border-slate-700 text-slate-100 font-mono text-sm focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-cyan-500/50 transition-colors"
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rb,.php,.html,.css"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-500" />
              <p className="text-slate-300 mb-2">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-slate-500 text-sm">
                Supports: JS, TS, Python, Java, C++, Go, Ruby, PHP, HTML, CSS
              </p>
            </label>
          </motion.div>
        )}

        {/* Scan Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleScan}
            disabled={!code.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-bold px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scan className="w-5 h-5 mr-2" />
            Initiate Security Scan
          </Button>
        </div>
      </div>
    </Card>
  );
}