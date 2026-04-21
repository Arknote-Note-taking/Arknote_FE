import React, { useState } from 'react';
import API from '../services/api';
import { X, Sparkles, MessageSquare, Loader2, Link as LinkIcon } from 'lucide-react';

const DocumentDetail = ({ doc, onClose }) => {
  const [summary, setSummary] = useState(doc.summary || null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loadingQna, setLoadingQna] = useState(false);

  if (!doc) return null;

  const handleSummarize = async () => {
    setLoadingSummary(true);
    try {
      const res = await API.post('/ai/summarize', { documentId: doc.id });
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleQnA = async (e) => {
    e.preventDefault();
    if (!question) return;
    setLoadingQna(true);
    try {
      const res = await API.post('/ai/qna', { documentId: doc.id, question });
      setAnswer(res.data.answer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQna(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[90] w-full max-w-lg bg-surface/95 backdrop-blur-xl border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transform transition-transform duration-300">
      <div className="h-full flex flex-col p-6 overflow-y-auto pt-24 custom-scrollbar">
        <button onClick={onClose} className="absolute right-6 top-24 text-text-secondary hover:text-white bg-white/5 rounded-full p-2 transition-colors">
          <X className="w-5 h-5"/>
        </button>

        <span className="text-primary text-sm font-semibold tracking-wider font-mono uppercase mb-2 block">{doc.subject}</span>
        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{doc.title}</h2>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {doc.tags?.map((tag, idx) => (
            <span key={idx} className="bg-primary/20 text-primary border border-primary/30 text-xs px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* AI Summarize Block */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 opacity-50"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>AI Summary</span>
            </h3>
            {!summary && !loadingSummary && (
              <button 
                onClick={handleSummarize}
                className="text-xs font-semibold bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Summarize Now
              </button>
            )}
            {loadingSummary && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
          </div>
          
          {summary ? (
            <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-purple-500/50">
              {summary}
            </div>
          ) : (
             <p className="text-text-secondary/50 text-sm italic">Summary not generated yet. Click above to trigger AI.</p>
          )}
        </div>

        {/* QnA Block */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
           <h3 className="text-white font-medium flex items-center space-x-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span>Ask Document</span>
           </h3>
           
           <form onSubmit={handleQnA} className="flex gap-2">
             <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is the main idea of this document?"
                className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-text-secondary/50"
             />
             <button disabled={loadingQna || !question} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl border border-white/10 transition-colors disabled:opacity-50 flex items-center justify-center">
               {loadingQna ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
             </button>
           </form>

           {answer && (
             <div className="mt-4 p-4 bg-background border border-white/10 rounded-xl relative">
                <div className="absolute top-[-8px] left-6 w-4 h-4 bg-background border-t border-l border-white/10 rotate-45"></div>
                <p className="text-text-secondary text-sm leading-relaxed">{answer}</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default DocumentDetail;
