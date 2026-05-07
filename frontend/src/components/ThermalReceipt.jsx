import React, { forwardRef } from 'react';

const ThermalReceipt = forwardRef(({ billData }, ref) => {
  if (!billData) return null;

  // Format date/time
  const billDate = new Date(billData.date || new Date());
  // The backend might return date as a string like "03/05/2025 09:26 PM"
  // Let's parse it safely
  let dateStr = "";
  let timeStr = "";
  try {
    if (typeof billData.date === 'string' && billData.date.includes(' ')) {
      const parts = billData.date.split(' ');
      dateStr = parts[0].replace(/\//g, '-');
      timeStr = parts.slice(1).join(' ');
    } else {
      dateStr = billDate.toLocaleDateString('en-IN').replace(/\//g, '-');
      timeStr = billDate.toLocaleTimeString('en-IN', { hour12: false });
    }
  } catch (e) {
    dateStr = "N/A";
    timeStr = "N/A";
  }

  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-4 text-xs font-mono w-[300px]"
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      <div className="flex items-center justify-center space-x-2 mb-1">
        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span className="font-bold text-sm">RITE ELECTRICALS</span>
      </div>
      <div className="text-center text-[10px] leading-tight mb-2">
        451A, Periyar Nagar, Opp Rajaji Statue<br/>
        Thirumangalam-625 706<br/>
        Madurai Main Road, Tamil Nadu<br/>
        Phone: 9342244061, 9842204841<br/>
        GSTIN:33BMGPM7077J1ZO
      </div>
      
      <div className="border-t border-b border-black border-dashed py-1 my-1">
        <div className="flex justify-between">
          <span>Bill# {billData.bill_no}</span>
          <span>Date {dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span>Term {billData.payment_type}</span>
          <span>Time {timeStr}</span>
        </div>
        <div className="mt-1 font-bold">
          {billData.customer_name}<br/>
          {billData.place ? `${billData.place}` : ''}<br/>
          {billData.customer_phone}
        </div>
      </div>

      <table className="w-full text-left my-2">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="py-1 w-1/2">Items</th>
            <th className="py-1 text-right">MRP</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(billData.items || []).map((item, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td className="pt-1 font-bold break-words pr-1" colSpan={5}>
                  {item.brand} {item.name}
                </td>
              </tr>
              <tr>
                <td></td>
                <td className="text-right pb-1">{item.rate?.toFixed(2) || '0.00'}</td>
                <td className="text-right pb-1">{item.qty}</td>
                <td className="text-right pb-1">{item.rate?.toFixed(2) || '0.00'}</td>
                <td className="text-right pb-1">{item.amount?.toFixed(2) || '0.00'}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed pt-1 mb-2">
        <div className="flex justify-between font-bold text-sm">
          <span>Net Amount</span>
          <span>{billData.total?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {billData.include_gst && (
        <div className="border-t border-black border-dashed py-1 text-[10px]">
          <div className="flex justify-between">
            <span>CGST =&gt; {billData.subtotal?.toFixed(2)} x 9% =</span>
            <span>{billData.cgst?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST =&gt; {billData.subtotal?.toFixed(2)} x 9% =</span>
            <span>{billData.sgst?.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="text-center mt-4 text-[10px] font-bold">
        Thank you for your business!<br/>
        Please visit again!
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
