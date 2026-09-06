import React from 'react';

export interface EvidenceCitation {
  id: string;
  tag: string;
  sourceText: string;
  confidence: number;
}

export interface AIAssistantPanelProps {
  title?: string;
  statusText?: string;
  summaryParagraph: string;
  citations: EvidenceCitation[];
  onCitationClick?: (citation: EvidenceCitation) => void;
  onAccept?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
}

export function AIAssistantPanel({
  title = 'AI Clinical Copilot',
  statusText = '● Traceable Evidence Verified',
  summaryParagraph,
  citations,
  onCitationClick,
  onAccept,
  onEdit,
  onReject,
}: AIAssistantPanelProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-5 shadow-sm space-y-4">
      {/* Panel Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <span className="text-xs font-semibold text-emerald-600">{statusText}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-full">
          100% Traceable
        </span>
      </div>

      {/* Summary Content with Inline Citation Chips */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed shadow-inner">
        <p>
          {summaryParagraph}{' '}
          {citations.map((c) => (
            <button
              key={c.id}
              onClick={() => onCitationClick?.(c)}
              className="inline-flex items-center px-2 py-0.5 mx-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold font-mono transition-colors shadow-xs"
              title={`Source: ${c.sourceText} (${Math.round(c.confidence * 100)}% confidence)`}
            >
              [{c.tag}]
            </button>
          ))}
        </p>
      </div>

      {/* Citation Sources Footnote List */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Source References</p>
        <div className="flex flex-wrap gap-2">
          {citations.map((c) => (
            <div
              key={c.id}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <span className="font-mono font-bold text-blue-600">[{c.tag}]</span>
              <span className="text-slate-600 truncate max-w-[200px]">{c.sourceText}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Physician Action Bar */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400 font-medium">Physician remains final authority</span>
        <div className="flex space-x-2">
          {onReject && (
            <button
              onClick={onReject}
              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Reject
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Edit Draft
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Accept & Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
