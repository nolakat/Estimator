import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export function EstimatePreviewModal({ isOpen, onClose, project, totals, money, sectionSubtotal }) {
  const contentRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    try {
      const element = contentRef.current;
      const filename = `${project?.name || 'Estimate'}_${project?.estimateNumber || ''}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');

      const opt = {
        margin: 0.3,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const validSections = (project?.sections || []).filter(section => {
    const validItems = (section.items || []).filter(item => {
      const hasDescription = item.desc && item.desc.trim() !== '';
      const hasCost = Number(item.qty || 0) * Number(item.unitCost || 0) > 0;
      return hasDescription && hasCost;
    });
    return validItems.length > 0;
  });

  return (
    <>
      {/* Dark Overlay */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Floating Action Buttons */}
      <div className="fixed z-50 flex gap-2 top-4 right-4">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-white transition-all bg-white/10 hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PDF-style Document */}
      <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
        <div className="flex justify-center min-h-full px-4 py-16">
          <div
            ref={contentRef}
            className="w-full max-w-[8.5in] bg-white shadow-2xl pointer-events-auto flex flex-col min-h-[11in]"
            style={{ boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.5)' }}
          >
            {/* Header */}
            <div className="px-10 py-6 text-white bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold tracking-wide">ESTIMATE</h1>
                  <p className="text-sm text-slate-400">{project?.estimateNumber || '#001'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-300">{project?.name || 'Untitled Project'}</p>
                  <p className="text-sm text-slate-400">{project?.estimateDate || new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>
            </div>

            {/* Client Info Bar */}
            <div className="px-10 py-6 border-b bg-slate-50 border-slate-200">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Client</p>
                  <p className="mt-1 font-medium text-slate-800">{project?.clientName || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Phone</p>
                  <p className="mt-1 font-medium text-slate-800">{project?.clientPhone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Email</p>
                  <p className="mt-1 font-medium text-slate-800">{project?.clientEmail || '—'}</p>
                </div>
              </div>
            </div>

            {/* Scope of Work */}
            <div className="flex-1 px-10 py-8">

              <div className="space-y-6">
                {validSections.map((section) => (
                  <div key={section.id} className="overflow-hidden border border-slate-200">
                    <div className="px-4 py-2 border-b bg-slate-100 border-slate-200">
                      <h4 className="font-semibold text-slate-800">{section.name}</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-2 text-xs font-semibold text-left uppercase text-slate-500">Description</th>
                          <th className="w-32 px-4 py-2 text-xs font-semibold text-right uppercase text-slate-500">Qty</th>
                          <th className="px-4 py-2 text-xs font-semibold text-right uppercase text-slate-500 w-28">Unit Price</th>
                          <th className="px-4 py-2 text-xs font-semibold text-right uppercase text-slate-500 w-28">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(section.items || [])
                          .filter(item => {
                            const hasDescription = item.desc && item.desc.trim() !== '';
                            const hasCost = Number(item.qty || 0) * Number(item.unitCost || 0) > 0;
                            return hasDescription && hasCost;
                          })
                          .map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-slate-800">{item.desc}</td>
                              <td className="px-4 py-2 text-right text-slate-600 whitespace-nowrap">
                                {item.qty}
                                {item.qty && item.unit && <span className="text-xs text-slate-400"> / {item.unit}</span>}
                                {!item.qty && item.unit && <span className="text-xs text-slate-400">{item.unit}</span>}
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">{money(item.unitCost)}</td>
                              <td className="px-4 py-2 font-medium text-right text-slate-800">
                                {money(Number(item.qty || 0) * Number(item.unitCost || 0))}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50">
                          <td colSpan="3" className="px-4 py-2 text-sm font-medium text-right text-slate-600">Section Total</td>
                          <td className="px-4 py-2 font-bold text-right text-slate-800">{money(sectionSubtotal(section))}</td>
                        </tr>
                      </tfoot>
                    </table>
                    {section.notes && (
                      <div className="px-4 py-2 text-sm italic border-t border-slate-200 text-slate-500 bg-slate-50">
                        {section.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="px-10 py-8 mt-auto bg-slate-50">
              <h3 className="mb-6 text-sm font-semibold tracking-wider uppercase text-slate-400">Summary</h3>

              <div className="grid grid-cols-2 gap-8">
                {/* Category Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Materials</span>
                    <span className="font-medium text-slate-800">{money(totals?.byCategory?.materials || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Labor</span>
                    <span className="font-medium text-slate-800">{money(totals?.byCategory?.labor || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subcontract</span>
                    <span className="font-medium text-slate-800">{money(totals?.byCategory?.subcontract || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Other</span>
                    <span className="font-medium text-slate-800">{money(totals?.byCategory?.other || 0)}</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="p-5 bg-white border border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium text-slate-800">{money(totals?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sales Tax</span>
                      <span className="text-slate-600">{money(totals?.tax || 0)}</span>
                    </div>
                    <div className="h-px my-3 bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-800">Total Due</span>
                      <span className="text-2xl font-bold text-slate-900">{money(totals?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {project?.notes && (
              <div className="px-10 py-6 border-t border-slate-200">
                <h3 className="mb-3 text-sm font-semibold tracking-wider uppercase text-slate-400">Terms & Notes</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">{project.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
