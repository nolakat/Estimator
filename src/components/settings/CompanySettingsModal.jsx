import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';

export function CompanySettingsModal({ isOpen, onClose, companySettings, onSave }) {
  const [formData, setFormData] = useState({
    companyLogo: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
  });

  useEffect(() => {
    if (isOpen && companySettings) {
      setFormData({
        companyLogo: companySettings.companyLogo || '',
        companyName: companySettings.companyName || '',
        companyAddress: companySettings.companyAddress || '',
        companyPhone: companySettings.companyPhone || '',
        companyEmail: companySettings.companyEmail || '',
      });
    }
  }, [isOpen, companySettings]);

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  // Validate email format
  const isValidEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, companyLogo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

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

  if (!isOpen) return null;

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none md:inset-8">
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Company Settings</h2>
                <p className="text-sm text-slate-500">This information appears on all your estimates</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute p-2 transition-all duration-200 rounded-full top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Logo Upload */}
            <div>
              <label className={labelClasses}>Company Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className={inputClasses}
              />
              {formData.companyLogo && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <img
                    src={formData.companyLogo}
                    alt="Company logo"
                    className="h-16 w-auto object-contain"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, companyLogo: '' }))}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className={labelClasses}>Company Name</label>
              <input
                id="companyName"
                className={inputClasses}
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your company name"
              />
            </div>

            {/* Company Address */}
            <div>
              <label htmlFor="companyAddress" className={labelClasses}>Company Address</label>
              <textarea
                id="companyAddress"
                className={`${inputClasses} min-h-20 resize-none`}
                value={formData.companyAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                placeholder="123 Main Street&#10;City, State 12345"
              />
            </div>

            {/* Company Phone */}
            <div>
              <label htmlFor="companyPhone" className={labelClasses}>Company Phone</label>
              <input
                id="companyPhone"
                className={inputClasses}
                type="tel"
                placeholder="(555) 555-5555"
                value={formData.companyPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: formatPhoneNumber(e.target.value) }))}
              />
            </div>

            {/* Company Email */}
            <div>
              <label htmlFor="companyEmail" className={labelClasses}>Company Email</label>
              <input
                id="companyEmail"
                className={`${inputClasses} ${formData.companyEmail && !isValidEmail(formData.companyEmail) ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                type="email"
                placeholder="contact@company.com"
                value={formData.companyEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
              />
              {formData.companyEmail && !isValidEmail(formData.companyEmail) && (
                <p className="mt-1 text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-xl text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
