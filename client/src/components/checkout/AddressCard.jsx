export default function AddressCard({ address, selected, onSelect, onEdit, onDelete, onMakeDefault, selectable = true }) {
  const a = address;
  return (
    <div className={`rounded-xl border-2 p-4 text-sm ${selected ? 'border-primary bg-primary-light/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        {selectable && (
          <input
            type="radio"
            name="address"
            id={`address-${a.id}`}
            checked={!!selected}
            onChange={() => onSelect?.(a.id)}
            className="mt-1 h-4 w-4 accent-primary"
            aria-label={`Deliver to ${a.fullName}`}
          />
        )}
        <div className="flex-1">
          <p className="font-semibold text-secondary">
            {a.fullName}
            {a.isDefault && <span className="ml-2 rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold text-amber-800">Default</span>}
          </p>
          <p className="text-slate-600">
            {a.houseNumber}, {a.street}
          </p>
          <p className="text-slate-600">
            {a.city}, {a.state}, {a.country} - {a.pincode}
          </p>
          <p className="text-slate-600">Phone: {a.phone}</p>
          {(onEdit || onDelete || onMakeDefault) && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              {onEdit && (
                <button type="button" className="text-primary hover:underline" onClick={() => onEdit(a)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button type="button" className="text-red-600 hover:underline" onClick={() => onDelete(a)}>
                  Delete
                </button>
              )}
              {onMakeDefault && !a.isDefault && (
                <button type="button" className="text-slate-600 hover:underline" onClick={() => onMakeDefault(a)}>
                  Set as default
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
