import { useRef, useState } from 'react';

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function PhotoUpload({ value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function pick(file: File | null) {
    if (!file) { onChange(null); setPreview(null); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Photo must be JPG, PNG, or WebP.'); return;
    }
    onChange(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Profile photograph <span className="text-red-600">*</span>
      </label>
      <p className="text-xs text-gray-600">
        Required for identity verification at attendance. Clear, recent, face visible.
      </p>

      <div
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-describedby={error ? 'photo-error' : undefined}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="mx-auto h-40 w-40 object-cover rounded-md" />
        ) : (
          <div className="text-gray-500 text-sm">Click to choose a photograph</div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p id="photo-error" className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}