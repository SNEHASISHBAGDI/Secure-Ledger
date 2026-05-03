import React from 'react';

export default function RecentActivity({ activities = [] }) {
  // Helper to format dates nicely
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
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
                  {entry.type} ₹{entry.amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Ref: {entry.transaction.slice(-6)}</div>
              </div>
              <div className="text-sm text-gray-500">
                ({formatDate(entry.createdAt)})
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}