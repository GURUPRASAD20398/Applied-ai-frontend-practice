export default function AddressCard({ address, selected, onSelect, onEdit, onDelete, onMakeDefault, selectable = true }) {
  const a = address;
  return (
    <div className={`rounded-xl p-4 text-sm ${selected ? 'bg-layer-2 shadow-[inset_3px_0_0_#0f62fe]' : 'bg-canvas'}`}>
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
          <p className="font-semibold text-white">
            {a.fullName}
            {a.isDefault && <span className="ml-2 bg-layer-3 px-2 py-0.5 text-xs font-normal text-white">Default</span>}
          </p>
          <p className="text-muted">
            {a.houseNumber}, {a.street}
          </p>
          <p className="text-muted">
            {a.city}, {a.state}, {a.country} - {a.pincode}
          </p>
          <p className="text-muted">Phone: {a.phone}</p>
          {(onEdit || onDelete || onMakeDefault) && (
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              {onEdit && (
                <button type="button" className="text-link hover:underline" onClick={() => onEdit(a)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button type="button" className="text-danger hover:underline" onClick={() => onDelete(a)}>
                  Delete
                </button>
              )}
              {onMakeDefault && !a.isDefault && (
                <button type="button" className="text-muted hover:underline" onClick={() => onMakeDefault(a)}>
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
