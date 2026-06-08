"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera,
  CreditCard,
  RotateCcw,
  Upload,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { resizeImage, resizeDataUrl } from "@/lib/image-client";
import { describeFace, faceSimilarity, preloadFaceModels } from "@/lib/face-client";

type StepKey = "front" | "back" | "selfie" | "review";
const STEPS: { key: StepKey; label: string }[] = [
  { key: "front", label: "Frente del DNI" },
  { key: "back", label: "Dorso del DNI" },
  { key: "selfie", label: "Selfie en vivo" },
  { key: "review", label: "Confirmar" },
];

export function VerificationFlow() {
  const router = useRouter();
  const { update } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [dniNumber, setDniNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  // Pre-carga los modelos de IA al entrar (para que el envío sea más rápido)
  useEffect(() => {
    preloadFaceModels();
  }, []);

  const step = STEPS[stepIndex];

  function canAdvance(): boolean {
    if (step.key === "front") return !!front;
    if (step.key === "back") return !!back;
    if (step.key === "selfie") return !!selfie;
    return /^\d{7,8}$/.test(dniNumber);
  }

  async function submit() {
    if (!front || !back || !selfie) return;
    if (!consent) {
      setError("Necesitamos tu consentimiento para tratar tus datos de identidad.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Reconocimiento facial en el navegador: compara la cara del DNI con la selfie
    let matchScore: number | undefined;
    let livenessScore: number | undefined;
    try {
      setFaceStatus("Analizando rostro...");
      const [dniFace, selfieFace] = await Promise.all([
        describeFace(front),
        describeFace(selfie),
      ]);
      if (selfieFace) livenessScore = selfieFace.faceScore;
      if (dniFace && selfieFace) {
        matchScore = await faceSimilarity(dniFace.descriptor, selfieFace.descriptor);
      }
    } catch {
      // Si la IA falla (CDN bloqueado, sin WebGL, etc.) seguimos sin scores → revisión manual
    } finally {
      setFaceStatus(null);
    }

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dniNumber,
          dniFront: front,
          dniBack: back,
          selfie,
          matchScore,
          livenessScore,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo enviar la verificación.");
      }
      await update(); // refresca el estado de verificación en la sesión
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                i < stepIndex
                  ? "bg-brand-600 text-white"
                  : i === stepIndex
                  ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={i === stepIndex ? "font-medium text-gray-900" : "text-gray-400"}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-gray-200" />}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {step.key === "front" && (
        <PhotoInput
          icon={CreditCard}
          title="Fotografiá el FRENTE de tu DNI"
          hint="Asegurate de que se lean todos los datos y que no haya reflejos."
          value={front}
          onChange={setFront}
        />
      )}

      {step.key === "back" && (
        <PhotoInput
          icon={CreditCard}
          title="Fotografiá el DORSO de tu DNI"
          hint="Incluí el código de barras / MRZ del reverso."
          value={back}
          onChange={setBack}
        />
      )}

      {step.key === "selfie" && (
        <SelfieCapture value={selfie} onChange={setSelfie} />
      )}

      {step.key === "review" && (
        <div className="space-y-4">
          <h3 className="font-semibold">Revisá y confirmá</h3>
          <div className="grid grid-cols-3 gap-3">
            <Thumb label="Frente" src={front} />
            <Thumb label="Dorso" src={back} />
            <Thumb label="Selfie" src={selfie} />
          </div>
          <div>
            <label className="label" htmlFor="dni">Número de DNI</label>
            <input
              id="dni"
              inputMode="numeric"
              className="input"
              placeholder="Ej: 30123456"
              value={dniNumber}
              onChange={(e) => setDniNumber(e.target.value.replace(/\D/g, ""))}
            />
            <p className="mt-1 text-xs text-gray-400">Solo números, sin puntos.</p>
          </div>
          <p className="text-xs text-gray-400">
            Al enviar, comparamos la cara de tu DNI con la selfie (en tu dispositivo) y
            guardamos tus datos encriptados. Asegurate de que en el frente del DNI se vea
            bien tu foto.
          </p>

          <label className="flex items-start gap-2 rounded-lg bg-brand-50/60 p-3 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              Presto mi <strong>consentimiento expreso</strong> para que Trato trate mi DNI,
              las fotos del documento y mi selfie —que son <strong>datos sensibles</strong>—
              con el único fin de verificar mi identidad y prevenir fraudes. Sé que darlos es
              voluntario y que puedo revocar este consentimiento. Leí la{" "}
              <Link href="/privacidad" target="_blank" className="text-brand-600 hover:underline">
                Política de Privacidad
              </Link>
              .
            </span>
          </label>
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0 || submitting}
        >
          <ArrowLeft className="h-4 w-4" /> Atrás
        </Button>

        {step.key === "review" ? (
          <Button onClick={submit} loading={submitting} disabled={!canAdvance() || !consent}>
            {faceStatus || "Enviar verificación"}
          </Button>
        ) : (
          <Button onClick={() => setStepIndex((i) => i + 1)} disabled={!canAdvance()}>
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function PhotoInput({
  icon: Icon,
  title,
  hint,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const resized = await resizeImage(file, 1280, 0.85);
      onChange(resized);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{hint}</p>
      </div>

      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={title} className="w-full rounded-lg border border-gray-200" />
          <button
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium shadow"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Cambiar
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-gray-500 hover:border-brand-400 hover:bg-brand-50"
        >
          <Icon className="h-8 w-8" />
          <span className="text-sm font-medium">
            {busy ? "Procesando..." : "Tocá para subir o sacar foto"}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Upload className="h-3 w-3" /> JPG o PNG
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function SelfieCapture({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (value) return; // ya capturada
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setCameraError("No pudimos acceder a la cámara. Subí una foto en su lugar.");
      }
    }
    start();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [value]);

  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const resized = await resizeDataUrl(dataUrl, 1024, 0.85);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onChange(resized);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await resizeImage(file, 1024, 0.85));
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">Selfie en vivo (prueba de vida)</h3>
        <p className="text-sm text-gray-500">
          Mirá a la cámara con buena luz. Para una prueba de vida real, parpadeá o girá
          levemente la cabeza.
        </p>
      </div>

      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Selfie" className="mx-auto w-64 rounded-xl border border-gray-200" />
          <button
            onClick={() => onChange(null)}
            className="mx-auto mt-3 flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Volver a capturar
          </button>
        </div>
      ) : cameraError ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 shrink-0" /> {cameraError}
          </div>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Subir selfie
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="mx-auto aspect-[3/4] w-64 -scale-x-100 object-cover"
            />
          </div>
          <Button onClick={capture} className="w-full">
            <Camera className="h-4 w-4" /> Capturar selfie
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function Thumb({ label, src }: { label: string; src: string | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="aspect-square w-full rounded-lg border border-gray-200 object-cover" />
      ) : (
        <div className="aspect-square w-full rounded-lg bg-gray-100" />
      )}
    </div>
  );
}
