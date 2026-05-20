import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign, Plus, Trash2, Send, Edit2, Save, FileText,
  CheckCircle2, XCircle, AlertCircle, Calendar, Percent, Tag, FileDiff
} from 'lucide-react';
import {
  createEstimate,
  updateEstimate,
  sendEstimate,
  fetchEstimates,
  deleteEstimate,
  resendEstimate,
} from '../redux/slices/serviceRequestSlice';
import { toast } from 'react-hot-toast';

const EstimateManager = ({ connectionId, requestId, onEstimateSent, onResend }) => {
  const dispatch = useDispatch();
  const { estimates, currentEstimate, loading } = useSelector((state) => state.serviceRequest);

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [formData, setFormData] = useState({
    tax_rate: '',
    discount_amount: '',
    notes: '',
    expires_at: '',
    line_items: []
  });

  useEffect(() => {
    if (connectionId) {
      dispatch(fetchEstimates(connectionId));
    }
  }, [connectionId, dispatch]);

  useEffect(() => {
    if (currentEstimate && (currentEstimate.status === 'DRAFT' || currentEstimate.status === 'REJECTED')) {
      const items = (currentEstimate.line_items || []).map((item) => ({
        item_type: item.item_type || 'LABOR',
        description: item.description || '',
        quantity: String(item.quantity || ''),
        unit_price: String(item.unit_price || ''),
      }));
      setFormData({
        tax_rate: String(currentEstimate.tax_rate || ''),
        discount_amount: String(currentEstimate.discount_amount || ''),
        notes: currentEstimate.notes || '',
        expires_at: currentEstimate.expires_at ? currentEstimate.expires_at.split('T')[0] : '',
        line_items: items,
      });
      if (currentEstimate.status === 'DRAFT') setIsEditing(true);
    }
  }, [currentEstimate]);

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { item_type: 'LABOR', description: '', quantity: '1', unit_price: '' }
      ]
    }));
  };

  const handleRemoveLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    setFormData(prev => {
      const newLineItems = [...prev.line_items];
      newLineItems[index] = { ...newLineItems[index], [field]: value };
      return { ...prev, line_items: newLineItems };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);

    const taxRate = parseFloat(formData.tax_rate) || 0;
    const discountAmount = parseFloat(formData.discount_amount) || 0;
    
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    return { subtotal, taxAmount, totalAmount };
  };

  const buildEstimatePayload = () => {
    return {
      tax_rate: Number(formData.tax_rate) || 0,
      discount_amount: Number(formData.discount_amount) || 0,
      notes: String(formData.notes || '').trim() || null,
      expires_at: formData.expires_at || null,
      line_items: formData.line_items.map((item) => ({
        item_type: item.item_type,
        description: String(item.description || '').trim(),
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      })),
    };
  };

  const handleSaveEstimate = async () => {
    if (formData.line_items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    const hasInvalidItem = formData.line_items.some(item => !item.description.trim() || !item.quantity || !item.unit_price);
    if (hasInvalidItem) {
      toast.error('Please complete description, quantity, and price for all items');
      return;
    }

    const estimateData = buildEstimatePayload();
    try {
      if (currentEstimate && (currentEstimate.status === 'DRAFT' || currentEstimate.status === 'REJECTED')) {
        await dispatch(updateEstimate({ estimateId: currentEstimate.id, estimateData })).unwrap();
        toast.success('Estimate updated successfully');
        setIsEditing(false);
      } else {
        await dispatch(createEstimate({ connectionId, estimateData })).unwrap();
        toast.success('Estimate created successfully');
        setShowCreateModal(false);
        resetForm();
      }
      dispatch(fetchEstimates(connectionId));
    } catch (error) {
      toast.error(error.error || 'Failed to save estimate');
    }
  };

  const handleSendEstimate = async () => {
    if (!currentEstimate) return toast.error('No estimate to send');
    const { totalAmount } = calculateTotals();
    if (totalAmount <= 0) return toast.error('Total amount must be greater than zero');

    try {
      await dispatch(sendEstimate({ estimateId: currentEstimate.id, requestId })).unwrap();
      toast.success('Estimate sent to customer');
      setIsEditing(false);
      if (onEstimateSent) onEstimateSent();
    } catch (error) {
      toast.error(error.error || 'Failed to send estimate');
    }
  };

  const handleDeleteEstimate = async () => {
    if (!currentEstimate || currentEstimate.status !== 'DRAFT') return;
    if (!window.confirm('Are you sure you want to delete this draft estimate?')) return;

    try {
      await dispatch(deleteEstimate({ estimateId: currentEstimate.id, connectionId })).unwrap();
      toast.success('Estimate deleted');
      resetForm();
      setIsEditing(false);
    } catch (error) {
      toast.error(error.error || 'Failed to delete estimate');
    }
  };

  const resetForm = () => {
    setFormData({ tax_rate: '', discount_amount: '', notes: '', expires_at: '', line_items: [] });
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();
  const activeEstimate = estimates.find(e => e.status === 'DRAFT') || 
                         estimates.find(e => e.status === 'SENT') || 
                         estimates.find(e => e.status === 'REJECTED') || 
                         estimates[0];

  if (!connectionId) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200 max-w-4xl mx-auto">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">No active connection found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full overflow-hidden transition-all duration-300">
      
      {/* Header Panel */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Estimate Manager</h3>
            {activeEstimate && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-0.5 ${
                activeEstimate.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                activeEstimate.status === 'SENT' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                activeEstimate.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                ● {activeEstimate.status}
              </span>
            )}
          </div>
        </div>

        {activeEstimate && activeEstimate.status === 'DRAFT' && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={handleDeleteEstimate}
              className="flex items-center justify-center p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
              title="Delete Draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Form Mode (Create / Edit) */}
        {(isEditing || showCreateModal) ? (
          <div className="space-y-6">
            
            {/* Modernized Grid-Based Line Items System */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-700 tracking-wide uppercase">Line Items</h4>
                <button
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm shadow-indigo-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              {/* Scrollable container with min-width guard rails preventing compression */}
              <div className="border border-slate-200 rounded-xl shadow-sm overflow-x-auto bg-white">
                <div className="min-w-[768px]">
                  
                  {/* Table Header via CSS Grid */}
                  <div className="grid grid-cols-[140px_1fr_90px_130px_110px_44px] bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200 p-3 gap-3">
                    <div>Type</div>
                    <div>Description</div>
                    <div className="text-center">Qty</div>
                    <div className="text-right">Price (₹)</div>
                    <div className="text-right">Amount</div>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-slate-100">
                    {formData.line_items.map((item, index) => {
                      const rowAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                      return (
                        <div key={index} className="grid grid-cols-[140px_1fr_90px_130px_110px_44px] items-center p-2.5 gap-3 hover:bg-slate-50/40 transition-colors">
                          {/* Item Type Dropdown */}
                          <div>
                            <select
                              value={item.item_type}
                              onChange={(e) => handleLineItemChange(index, 'item_type', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                            >
                              <option value="LABOR">Labor</option>
                              <option value="PARTS">Parts</option>
                              <option value="ADDITIONAL">Additional</option>
                            </select>
                          </div>

                          {/* Description Text Input */}
                          <div>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              placeholder="e.g. Brake pad replacement"
                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800"
                            />
                          </div>

                          {/* Quantity Input */}
                          <div>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800"
                            />
                          </div>

                          {/* Unit Price Input */}
                          <div>
                            <div className="relative rounded-lg shadow-sm">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={item.unit_price}
                                onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-2 pr-2 text-xs font-semibold text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800"
                              />
                            </div>
                          </div>

                          {/* Total Row Amount */}
                          <div className="font-bold text-slate-700 text-right pr-1 text-xs">
                            ₹{rowAmount.toFixed(2)}
                          </div>

                          {/* Delete Row Action Button */}
                          <div className="text-center">
                            <button
                              onClick={() => handleRemoveLineItem(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {formData.line_items.length === 0 && (
                  <div className="p-8 text-center text-slate-400 bg-slate-50/30">
                    <FileDiff className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No line items added yet. Click 'Add Item' to start building.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Adjustments & Meta details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" /> Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expiry Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Form Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Notes to Customer</label>
              <textarea
                rows="2"
                placeholder="Provide terms, scope details, or general notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none"
              />
            </div>

            {/* Calculations Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 ml-auto w-full sm:max-w-sm space-y-2 shadow-sm">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax ({parseFloat(formData.tax_rate) || 0}%)</span>
                <span className="font-semibold text-slate-800">₹{taxAmount.toFixed(2)}</span>
              </div>
              {(parseFloat(formData.discount_amount) > 0) && (
                <div className="flex justify-between text-sm text-rose-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{(parseFloat(formData.discount_amount) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800">Grand Total</span>
                <span className="text-xl font-black text-emerald-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Form Actions Footers */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleSaveEstimate}
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm shadow-md shadow-indigo-100"
              >
                <Save className="w-4 h-4" /> {currentEstimate ? 'Update Draft' : 'Save Draft'}
              </button>
              {currentEstimate && currentEstimate.status === 'DRAFT' && (
                <button
                  onClick={handleSendEstimate}
                  disabled={loading || formData.line_items.length === 0 || totalAmount <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm shadow-md shadow-emerald-100"
                >
                  <Send className="w-4 h-4" /> Send to Customer
                </button>
              )}
              <button
                onClick={() => {
                  setIsEditing(false);
                  setShowCreateModal(false);
                  if (!currentEstimate) resetForm();
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : activeEstimate ? (
          /* View Mode - Static Dashboard Display */
          <div className="space-y-6">
            {activeEstimate.expires_at && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Valid Until: {new Date(activeEstimate.expires_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
            )}

            {/* Displaying Items Cleanly */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Itemized Summary</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {activeEstimate.line_items.map((item, index) => (
                  <div key={index} className="p-4 bg-slate-50/40 flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center gap-2 sm:gap-4 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600">
                          {item.item_type}
                        </span>
                        <p className="font-semibold text-slate-800 break-words">{item.description}</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.quantity} units × ₹{parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="font-bold text-slate-900 whitespace-nowrap text-right">
                      ₹{parseFloat(item.total).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Invoicing Breakdown Block */}
            <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-5 ml-auto w-full sm:max-w-xs space-y-2.5 shadow-lg">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
              </div>
              {activeEstimate.tax_amount > 0 && (
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Tax ({activeEstimate.tax_rate}%)</span>
                  <span className="font-semibold text-white">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {activeEstimate.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-rose-400 font-medium">
                  <span>Discount Applied</span>
                  <span>-₹{parseFloat(activeEstimate.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Final Total</span>
                <span className="text-xl font-black text-emerald-400">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Notes display */}
            {activeEstimate.notes && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimate Notes</h5>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{activeEstimate.notes}</p>
              </div>
            )}

            {/* Real-time Status feedback blocks & Interactive Resending paths */}
            {activeEstimate.status === 'SENT' && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-sky-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sky-900 text-sm">Awaiting Review</p>
                  <p className="text-xs text-sky-700">This estimate was successfully dispatched to your customer. Waiting for customer action.</p>
                </div>
              </div>
            )}

            {activeEstimate.status === 'APPROVED' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900 text-sm">Estimate Approved</p>
                  <p className="text-xs text-emerald-700">The client signed off on this transaction configuration.</p>
                </div>
              </div>
            )}

            {activeEstimate.status === 'REJECTED' && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
                <div className="flex gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-rose-900 text-sm">Estimate Declined</p>
                    <p className="text-xs text-rose-700">The customer rejected this quote layout. Revise or re-send to retry.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 text-xs transition shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Revise Quote
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await dispatch(resendEstimate({ estimateId: activeEstimate.id, requestId })).unwrap();
                        toast.success('Estimate resent to customer');
                        if (connectionId) dispatch(fetchEstimates(connectionId));
                        if (onResend) onResend();
                      } catch (e) {
                        toast.error(e?.error || 'Failed to resend estimate');
                      }
                    }}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 text-xs transition shadow-sm shadow-sky-100"
                  >
                    <Send className="w-3.5 h-3.5" /> Force Resend As-Is
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Initial State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-800 mb-0.5">No active estimate</p>
            <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto">Prepare an itemized billing configuration statement details to share values transparently with the customer.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold inline-flex items-center gap-2 text-sm shadow-md shadow-emerald-100 transition"
            >
              <Plus className="w-4 h-4" /> Create Estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimateManager;