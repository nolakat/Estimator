import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function EstimatePreviewModal({ isOpen, onClose, project, totals, money, sectionSubtotal }) {
  // Hide body overflow when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-scroll">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Estimate Preview</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-lg">
            {/* Estimate Header */}
            <div className="p-8 text-white bg-blue-600">
              <div className="text-center">
                <h1 className="mb-2 text-4xl font-bold">ESTIMATE</h1>
                <div className="text-xl opacity-90">
                  {project?.name || 'Untitled Project'}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-8 border-b">
              <div className="grid grid-cols-2 gap-8">
              <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Client Information</h3>
                  <div className="space-y-2 text-gray-700">
                    <div><span className="font-medium">Name:</span> {project?.clientName || 'Not specified'}</div>
                    <div><span className="font-medium">Phone:</span> {project?.clientPhone || 'Not specified'}</div>
                    <div><span className="font-medium">Email:</span> {project?.clientEmail || 'Not specified'}</div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Project Information</h3>
                  <div className="space-y-2 text-gray-700">
                    <div><span className="font-medium">Estimate Number:</span> {project?.estimateNumber || '#001'}</div>
                    <div><span className="font-medium">Date:</span> {project?.estimateDate || new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Scope of Work */}
            <div className="p-8">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Scope of Work</h3>
              <div className="space-y-6">
                {(project?.sections || []).map((section, idx) => (
                  <div key={section.id} className="overflow-hidden border rounded-lg">
                    <div className="px-4 py-3 bg-gray-100 border-b">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {section.name}
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {(section.items || []).map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.desc}</div>
                              <div className="text-sm text-gray-600">
                                Category: {item.category} • Qty: {item.qty} {item.unit}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                ${Number(item.qty || 0) * Number(item.unitCost || 0)}
                              </div>
                              <div className="text-sm text-gray-600">
                                @ ${item.unitCost}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 mt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Section Subtotal:</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${sectionSubtotal(section)}
                          </span>
                        </div>
                        {section.notes && (
                          <div className="mt-2 text-sm italic text-gray-600">
                            Notes: {section.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rates & Markups */}
            <div className="p-8 border-t bg-gray-50">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Rates & Markups</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-700">
                <div><span className="font-medium">Sales Tax:</span> {project?.rates?.taxPct || 0}%</div>
                <div><span className="font-medium">Overhead:</span> {project?.rates?.overheadPct || 0}%</div>
                <div><span className="font-medium">Profit:</span> {project?.rates?.profitPct || 0}%</div>
                <div><span className="font-medium">Contingency:</span> {project?.rates?.contingencyPct || 0}%</div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-8 bg-white">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Materials:</span>
                  <span className="font-medium text-gray-900">${money(totals?.byCategory?.materials || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Labor:</span>
                  <span className="font-medium text-gray-900">${money(totals?.byCategory?.labor || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Subcontract:</span>
                  <span className="font-medium text-gray-900">${money(totals?.byCategory?.subcontract || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Other:</span>
                  <span className="font-medium text-gray-900">${money(totals?.byCategory?.other || 0)}</span>
                </div>

                <div className="h-px my-4 bg-gray-300" />

                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold text-gray-900">SUBTOTAL:</span>
                  <span className="font-bold text-gray-900">${money(totals?.subtotal || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Sales Tax:</span>
                  <span className="font-medium text-gray-900">${money(totals?.tax || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Overhead:</span>
                  <span className="font-medium text-gray-900">${money(totals?.overhead || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Profit:</span>
                  <span className="font-medium text-gray-900">${money(totals?.profit || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Contingency:</span>
                  <span className="font-medium text-gray-900">${money(totals?.contingency || 0)}</span>
                </div>

                <div className="h-px my-4 bg-gray-300" />

                <div className="flex items-center justify-between text-2xl">
                  <span className="font-bold text-gray-900">TOTAL:</span>
                  <span className="font-bold text-blue-600">${money(totals?.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {project?.notes && (
              <div className="p-8 border-t bg-gray-50">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{project.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="p-8 text-center text-gray-600 bg-gray-100">
              <p>Generated on {new Date().toLocaleDateString()}</p>
              <p className="mt-1 text-sm">This is a preview of your estimate</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Here you could add actual PDF generation logic
              alert('PDF generation would happen here in a real implementation');
            }}
            className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
