import { motion } from 'framer-motion';
import { MessageCircle, Upload } from 'lucide-react';
import { useRef } from 'react';
import { message } from '../../interfaces/interfaces';
import { Avatar } from './avatar';

interface OverviewProps {
  onFileContent: (content: string) => void;
}

export const Overview = ({ onFileContent }: OverviewProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      onFileContent(text);
    } catch (error) {
      console.error('Fehler beim Lesen der Datei:', error);
    }
  };

  return (
    <motion.div
      key="overview"
      className="max-w-4xl mx-auto md:mt-20 px-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="text-center mb-16">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <Avatar size={160} />
            <motion.div 
              className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: "spring" }}
            >
              FeelsGoodMan
            </motion.div>
          </div>
        </motion.div>
        <motion.h1 
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Willkommen beim Pepe Chat!
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          Hey! Ich bin dein freundlicher Chat-Assistent. 
          <br />Was möchtest du heute machen?
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          className="message-bubble rounded-2xl p-8 bg-card hover:bg-accent/50 cursor-pointer transition-colors flex flex-col items-center gap-6 border shadow-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle size={32} className="text-primary"/>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Jetzt chatten</h2>
            <p className="text-muted-foreground">Starte eine neue Konversation mit dem Chatbot</p>
          </div>
        </motion.div>

        <motion.div
          className="message-bubble rounded-2xl p-8 bg-card hover:bg-accent/50 cursor-pointer transition-colors flex flex-col items-center gap-6 border shadow-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.html,.css"
          />
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload size={32} className="text-primary"/>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Datei hochladen</h2>
            <p className="text-muted-foreground">Lade eine Datei hoch, um darüber zu sprechen</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
