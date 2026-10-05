'use client';

import { useRef } from 'react';
import { selectClinic } from '@/app/(dashboard)/clinician/actions';

interface Option {
  clinicId: string;
  name: string;
  role: string;
}

export function ClinicSwitcher({ options, current }: { options: Option[]; current: string }) {
  const form = useRef<HTMLFormElement>(null);
  if (options.length < 2) return null;
  return (
    <form ref={form} action={selectClinic}>
      <label className="sr-only" htmlFor="clinic-switcher">
        Clinic
      </label>
      <select
        id="clinic-switcher"
        name="clinicId"
        defaultValue={current}
        onChange={() => form.current?.requestSubmit()}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={o.clinicId} value={o.clinicId}>
            {o.name} ({o.role})
          </option>
        ))}
      </select>
    </form>
  );
}
