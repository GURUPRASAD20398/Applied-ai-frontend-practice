import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { addressSchema } from '../../utils/validators';
import FormField from '../common/FormField';

const FIELDS = [
  ['fullName', 'Full name', 'name', 'sm:col-span-2'],
  ['phone', 'Phone', 'tel', ''],
  ['houseNumber', 'House number', 'address-line2', ''],
  ['street', 'Street', 'address-line1', 'sm:col-span-2'],
  ['city', 'City', 'address-level2', ''],
  ['state', 'State', 'address-level1', ''],
  ['country', 'Country', 'country-name', ''],
  ['pincode', 'Pincode', 'postal-code', ''],
];

const EMPTY = { fullName: '', phone: '', houseNumber: '', street: '', city: '', state: '', country: 'India', pincode: '', isDefault: false };

export default function AddressForm({ initial, onSubmit, onCancel, serverErrors = {}, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(addressSchema), defaultValues: { ...EMPTY, ...initial } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map(([name, label, autoComplete, span]) => {
        const err = errors[name]?.message || serverErrors[name];
        return (
          <div key={name} className={span}>
            <FormField label={label} id={`addr-${name}`} error={err}>
              <input
                id={`addr-${name}`}
                autoComplete={autoComplete}
                aria-invalid={!!err}
                aria-describedby={err ? `addr-${name}-error` : undefined}
                className={`input ${err ? 'input-error' : ''}`}
                {...register(name)}
              />
            </FormField>
          </div>
        );
      })}
      <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
        <input type="checkbox" className="h-4 w-4 accent-primary" {...register('isDefault')} />
        Make this my default address
      </label>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save address'}</button>
      </div>
    </form>
  );
}
