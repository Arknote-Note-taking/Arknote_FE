import React from 'react';
import { FileText, Trash2, Shield, CalendarDays, ExternalLink } from 'lucide-react';

const DocumentCard = ({ doc, onClick, onDelete }) => {
  return (
    <div 
      className="bg-surface/50 border border-white/10 p-5 rounded-2xl hover:bg-surface transition-all cursor-pointer group flex flex-col justify-between"
      onClick={() => onClick(doc)}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="bg-primary/20 p-2 rounded-xl text-primary w-min">
            <FileText className="w-6 h-6" />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(doc.id);
            }}
            className="text-text-secondary hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-secondary/10 rounded-lg hover:bg-secondary/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-white font-semibold text-lg line-clamp-2 leading-tight">{doc.title}</h3>
        
        <div className="flex items-center space-x-2 mt-3 text-xs text-text-secondary">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>{doc.subject}</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <CalendarDays className="w-3 h-3" />
            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {doc.tags?.slice(0,3).map((tag, idx) => (
            <span key={idx} className="bg-white/5 border border-white/10 text-text-secondary text-xs px-2 py-1 rounded-full whitespace-nowrap">
              {tag}
            </span>
          ))}
          {doc.tags?.length > 3 && (
            <span className="bg-white/5 border border-white/10 text-text-secondary text-xs px-2 py-1 rounded-full whitespace-nowrap">
              +{doc.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-text-secondary group-hover:text-primary transition-colors">
        <span className="flex items-center space-x-1">
          <span>View Details</span>
          <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};

export default DocumentCard;
