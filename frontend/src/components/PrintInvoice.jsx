import React, { useState, useEffect } from 'react';
import API from '../utils/axiosConfig';
import { Sprout } from 'lucide-react';

const PrintInvoice = ({ transaction }) => {
  const [profile, setProfile] = useState({
    name: 'Rehman Agro Traders',
    contact: '0312-7788945',
    address: 'Chichawatni, Punjab, Pakistan',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get('/settings/profile');
        if (data) setProfile(data);
      } catch (err) {
        console.error('Failed to load profile for printing', err);
      }
    };
    fetchProfile();
  }, []);

  if (!transaction) return null;

  const isSale = transaction.type === 'STOCK_OUT';
  const displayId = transaction.invoiceNumber || transaction._id.toString().substring(18).toUpperCase();
  const partyLabel = isSale ? 'Bill To (Customer)' : 'Received From (Supplier)';
  const invoiceTypeTitle = isSale ? 'Sales Invoice / Retail Bill' : 'Stock Purchase Receipt';

  return (
    <div className="print-area w-full bg-white text-slate-800 font-sans p-2">
      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-primary-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-800 text-white">
            <Sprout size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-primary-900">{profile.name}</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Authorized Fertilizer & Seed Dealer
            </p>
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[14px] font-bold text-slate-800">{invoiceTypeTitle}</p>
          <p className="text-xs text-slate-500">Contact: {profile.contact}</p>
          <p className="text-[11px] text-slate-400 max-w-xs leading-snug">{profile.address}</p>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-2 gap-6 my-6 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {partyLabel}
          </span>
          <p className="text-sm font-bold text-slate-800">
            {transaction.customerSupplierName || 'Walk-in Customer'}
          </p>
          {transaction.notes && (
            <p className="text-xs text-slate-500 italic max-w-sm">Note: {transaction.notes}</p>
          )}
        </div>
        <div className="text-right space-y-1.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Invoice No.
            </span>
            <p className="text-sm font-bold text-primary-800">#{displayId}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Date & Time
            </span>
            <p className="text-xs font-semibold text-slate-700">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              {new Date(transaction.date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {transaction.createdBy && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Issued By (Operator)
              </span>
              <p className="text-xs font-semibold text-slate-700">
                @{transaction.createdBy}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item Table */}
      <div className="my-6 overflow-x-auto w-full print:overflow-visible">
        <table className="w-full min-w-[460px] sm:min-w-0 text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3 text-right">Rate</th>
              <th className="py-2.5 px-3 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transaction.items && transaction.items.map((item, idx) => (
              <tr key={idx} className="text-slate-700">
                <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{item.itemName}</td>
                <td className="py-2.5 px-3 text-right font-sans font-medium">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right font-sans">
                  Rs. {item.rate.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-sans font-bold text-slate-800">
                  Rs. {item.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end my-6">
        <div className="w-64 space-y-1.5 border-t border-slate-200 pt-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Total Items:</span>
            <span className="font-semibold">{transaction.items?.length || 0}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Total Quantity:</span>
            <span className="font-semibold">
              {transaction.items?.reduce((acc, c) => acc + c.quantity, 0) || 0}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
            <span className="font-bold text-slate-700">Net Payable:</span>
            <span className="font-sans font-extrabold text-primary-900">
              Rs. {transaction.totalAmount?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Signature boxes */}
      <div className="grid grid-cols-2 gap-12 mt-16 pt-6 border-t border-dashed border-slate-200">
        <div>
          <div className="w-40 border-b border-slate-400 mx-auto"></div>
          <p className="text-[10px] uppercase font-bold text-slate-400 text-center mt-1.5">
            Customer Signature
          </p>
        </div>
        <div className="text-right">
          <div className="w-40 border-b border-slate-400 ml-auto mr-0"></div>
          <p className="text-[10px] uppercase font-bold text-slate-400 text-center mt-1.5">
            Authorized Signature
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-[9px] text-slate-400 space-y-1">
        <p>Software generated slip from Rehman Agro Traders Management System.</p>
        <p>Printed on: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default PrintInvoice;
