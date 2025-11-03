
import React, { useState, useEffect, useCallback } from 'react';
import { User, Tab, Creation } from './types';

import Login from './components/Login';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import TextToImage from './components/TextToImage';
import ImageToImage from './components/ImageToImage';
import Upscaler from './components/Upscaler';
import PromptEnhancer from './components/PromptEnhancer';
import CaptionGenerator from './components/CaptionGenerator';
import StoryboardCreator from './components/StoryboardCreator';
import Spinner from './components/common/Spinner';

interface MyCreationsProps {
  creations: Creation[];
  onDelete: (id: string) => void;
}

const MyCreations: React.FC<MyCreationsProps> = ({ creations, onDelete }) => {
  if (creations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/50 p-6 rounded-2xl border border-purple-900/50">
        <h2 className="text-2xl font-semibold mb-2 text-purple-300">Your Gallery is Empty</h2>
        <p className="text-gray-400">Start creating with the tools to see your saved work here!</p>
      </div>
    );
  }

  const getTabName = (tab: Tab) => TABS.find(t => t.id === tab)?.name || 'Creation';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creations.map(creation => (
        <div key={creation.id} className="bg-gray-900/50 rounded-2xl shadow-[0_0_20px_rgba(128,90,213,0.2)] border border-purple-900/50 overflow-hidden flex flex-col">
          <div className="p-4">
            <h3 className="font-bold text-purple-300">{getTabName(creation.tab)}</h3>
            <p className="text-xs text-gray-500">{creation.timestamp}</p>
          </div>

          {creation.storyboardUrls && (
             <div className="grid grid-cols-2 gap-1 px-4">
               {creation.storyboardUrls.slice(0, 4).map((url, i) => <img key={i} src={url} className="w-full h-full object-cover rounded-md" alt={`storyboard panel ${i}`} />)}
             </div>
          )}
          {creation.resultImageUrl && <img src={creation.resultImageUrl} className="w-full object-cover" alt="Creation result" />}
          {creation.imageUrl && !creation.resultImageUrl && <img src={creation.imageUrl} className="w-full object-cover" alt="Creation source" />}
          
          <div className="p-4 bg-gray-900/70 flex-grow flex flex-col justify-between">
            <div>
              {creation.resultText ? (
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-800 p-2 rounded-md">"{creation.resultText.substring(0, 150)}{creation.resultText.length > 150 && '...'}"</p>
              ) : (
                <p className="text-sm text-gray-300">Prompt: <span className="text-gray-400 italic">"{creation.prompt}"</span></p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <a href={creation.resultImageUrl || creation.imageUrl || creation.storyboardUrls?.[0]} download={`creation-${creation.id}.png`} className="flex-1 text-center py-2 text-sm bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors">Download</a>
              <button onClick={() => onDelete(creation.id)} className="flex-1 text-center py-2 text-sm bg-red-800 hover:bg-red-700 rounded-lg font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


const TABS = [
  { id: Tab.TEXT_TO_IMAGE, name: 'Text → Image' },
  { id: Tab.IMAGE_TO_IMAGE, name: 'Magic Edit' },
  { id: Tab.UPSCALER, name: 'Upscaler' },
  { id: Tab.PROMPT_ENHANCER, name: 'Prompt+' },
  { id: Tab.CAPTION_GENERATOR, name: 'Captions' },
  { id: Tab.STORYBOARD_CREATOR, name: 'Storyboard' },
  { id: Tab.MY_CREATIONS, name: 'My Creations' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TEXT_TO_IMAGE);
  const [creations, setCreations] = useState<Creation[]>([]);

  useEffect(() => {
    const checkApiKey = async () => {
      setIsCheckingKey(true);
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setIsKeySelected(true);
      }
      setIsCheckingKey(false);
    };
    checkApiKey();
  }, []);

  const handleLogin = (email: string) => {
    setUser({
      email,
      isPremium: email.toLowerCase() === 'premium@user.com',
    });
  };
  
  const handleSaveCreation = (creationData: Omit<Creation, 'id' | 'timestamp'>) => {
    const newCreation: Creation = {
        ...creationData,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleString(),
    };
    setCreations(prev => [newCreation, ...prev]);
    alert('Saved to "My Creations"!');
    setActiveTab(Tab.MY_CREATIONS);
  };

  const handleDeleteCreation = (id: string) => {
      if (confirm('Are you sure you want to delete this creation?')) {
          setCreations(prev => prev.filter(c => c.id !== id));
      }
  };

  // FIX: Renamed from handleApiKeyError to onApiKeyError to fix scope errors when passing it as a prop.
  const onApiKeyError = useCallback(() => {
    console.error("API Key Error Detected. Resetting key selection.");
    setIsKeySelected(false);
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race condition and let the user proceed.
      // If the key is bad, onApiKeyError will be called on the next API call.
      setIsKeySelected(true);
    }
  };

  const renderActiveTab = () => {
    if (!user) return null;
    const commonProps = { user, onApiKeyError, onSave: handleSaveCreation };
    switch (activeTab) {
      case Tab.TEXT_TO_IMAGE:
        return <TextToImage {...commonProps} />;
      case Tab.IMAGE_TO_IMAGE:
        return <ImageToImage {...commonProps} />;
      case Tab.UPSCALER:
        return <Upscaler {...commonProps} />;
      case Tab.PROMPT_ENHANCER:
        return <PromptEnhancer onApiKeyError={onApiKeyError} onSave={handleSaveCreation} />;
      case Tab.CAPTION_GENERATOR:
        return <CaptionGenerator onApiKeyError={onApiKeyError} onSave={handleSaveCreation} />;
      case Tab.STORYBOARD_CREATOR:
        return <StoryboardCreator onApiKeyError={onApiKeyError} onSave={handleSaveCreation} />;
      case Tab.MY_CREATIONS:
        return <MyCreations creations={creations} onDelete={handleDeleteCreation} />;
      default:
        return null;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans transition-opacity duration-500 ease-in opacity-100">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-purple-900/50">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            AI Creative Studio
          </h1>
          <div className="text-sm text-gray-400">
            Welcome, <span className="font-semibold text-purple-300">{user.email}</span>
            {user.isPremium && <span className="ml-2 text-yellow-400">⭐️ Premium</span>}
          </div>
        </header>

        <main>
          {isCheckingKey ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="w-12 h-12 text-purple-400" />
            </div>
          ) : !isKeySelected ? (
            <ApiKeyPrompt onSelectKey={handleSelectKey} />
          ) : (
            <>
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <nav className="flex space-x-2 border-b border-gray-700">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors duration-200 focus:outline-none ${
                          activeTab === tab.id
                            ? 'bg-gray-900/50 border-b-2 border-purple-500 text-white'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                        }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
              <div className="transition-opacity duration-300 ease-in-out">
                {renderActiveTab()}
              </div>
            </>
          )}
        </main>

        <footer className="text-center mt-16 text-gray-500 text-sm">
          <p>Made with 💜 by Hassan Ali | Powered by Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}