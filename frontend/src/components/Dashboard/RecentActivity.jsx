import React from 'react';

export default function RecentActivity({ activities = [] }) {
  // Helper to format both dates and times nicely, with robust fallbacks
  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'Unknown Date';
    
    // Attempt standard parsing first
    let date = new Date(dateValue);
    
    // If it comes back invalid, it might be a numeric Unix timestamp passed as a string
    if (isNaN(date.getTime())) {
      date = new Date(Number(dateValue));
    }
    
    // If it's still invalid, return the fallback string to prevent crashes
    if (isNaN(date.getTime())) return 'Unknown Date';

    // Format to show Date AND Time (using en-IN for Indian date formats given the ₹ symbol)
    return date.toLocaleString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>
        ) : (
          activities.map((entry) => (
            <div key={entry._id} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0">
              <div>
                <div className={`font-bold ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {entry.type} ₹{entry.amount?.toLocaleString('en-IN') || 0}
                </div>
                {/* Added optional chaining (?) to prevent crashes if transaction ID is missing */}
                <div className="text-xs text-gray-400 mt-0.5">Ref: {entry.transaction?.slice(-6) || 'N/A'}</div>
              </div>
              <div className="text-sm text-gray-500 text-right">
                {formatDateTime(entry.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}