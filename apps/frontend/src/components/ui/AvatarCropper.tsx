import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { uploadCanvasImage } from "@/lib/imageUpload";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AvatarCropperProps {
  src: string;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

interface DragCoordinate {
  x: number;
  y: number;
}

/**
 * AvatarCropper component that displays a modal circular crop UI.
 */
export function AvatarCropper({ src, onCrop, onCancel }: AvatarCropperProps): React.JSX.Element {
  useBodyScrollLock();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<DragCoordinate>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<DragCoordinate | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState(false);

  const SIZE = 280;
  const RADIUS = SIZE / 2;
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      const fit = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      setScale(fit);
    };
    img.src = src;
  }, [src]);
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const canvasContext = canvasRef.current.getContext("2d");
    if (!canvasContext) return;
    canvasContext.clearRect(0, 0, SIZE, SIZE);
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
    canvasContext.clip();
    canvasContext.translate(RADIUS + offset.x, RADIUS + offset.y);
    canvasContext.rotate((rotation * Math.PI) / 180);
    canvasContext.scale(scale, scale);
    canvasContext.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);
    canvasContext.restore();
    canvasContext.save();
    canvasContext.strokeStyle = "rgba(255,255,255,0.9)";
    canvasContext.lineWidth = 3;
    canvasContext.beginPath();
    canvasContext.arc(RADIUS, RADIUS, RADIUS - 2, 0, Math.PI * 2);
    canvasContext.stroke();
    canvasContext.restore();
    canvasContext.save();
    canvasContext.fillStyle = "rgba(0,0,0,0.45)";
    canvasContext.fillRect(0, 0, SIZE, SIZE);
    canvasContext.globalCompositeOperation = "destination-out";
    canvasContext.beginPath();
    canvasContext.arc(RADIUS, RADIUS, RADIUS - 2, 0, Math.PI * 2);
    canvasContext.fill();
    canvasContext.restore();
  }, [imgEl, scale, rotation, offset]);
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      if (!dragging || !dragStart) return;
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [dragging, dragStart],
  );

  const onMouseUp = (): void => {
    setDragging(false);
  };
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>): void => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>): void => {
      if (!dragging || !dragStart) return;
      const touch = e.touches[0];
      setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
    },
    [dragging, dragStart],
  );

  const handleCrop = (): void => {
    if (!imgEl || saving) return;
    const OUT = 300;
    const out = document.createElement("canvas");
    out.width = OUT;
    out.height = OUT;
    const canvasContext = out.getContext("2d");
    if (!canvasContext) return;

    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    canvasContext.clip();

    const ratio = OUT / SIZE;
    canvasContext.translate(OUT / 2 + offset.x * ratio, OUT / 2 + offset.y * ratio);
    canvasContext.rotate((rotation * Math.PI) / 180);
    canvasContext.scale(scale * ratio, scale * ratio);
    canvasContext.drawImage(imgEl, -imgEl.naturalWidth / 2, -imgEl.naturalHeight / 2);
    canvasContext.restore();

    setSaving(true);
    void uploadCanvasImage(out, "avatar")
      .then((url) => onCrop(url))
      .catch(() => {
        setSaving(false);
      });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl z-10 w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border text-left">
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("contacts.form.cropProfilePhoto")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("contacts.form.cropperInstructions")}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shadow-none"
            aria-label={t("contacts.form.closeCropper")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center bg-neutral-900 py-6">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{
              width: SIZE,
              height: SIZE,
              cursor: dragging ? "grabbing" : "grab",
              borderRadius: "50%",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            onWheel={(event) => {
              event.preventDefault();
              setScale((prevScale) => Math.min(5, Math.max(0.3, prevScale - event.deltaY * 0.002)));
            }}
          />
        </div>

        <div className="px-5 py-3 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              min={0.3}
              max={5}
              step={0.01}
              value={[scale]}
              onValueChange={(values) => setScale(values[0])}
              className="flex-1"
              aria-label={t("contacts.form.zoomScale")}
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRotation((prevRotation) => prevRotation - 90)}
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors text-foreground shadow-none"
            >
              <RotateCw className="w-3.5 h-3.5 scale-x-[-1]" />
              <span>{t("contacts.form.rotate")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="px-3 min-h-[44px] rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors text-muted-foreground shadow-none"
            >
              {t("contacts.form.reset")}
            </Button>
            <Button
              type="button"
              onClick={handleCrop}
              className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-none"
            >
              <Check className="w-4 h-4" />
              <span>{t("contacts.form.applyPhoto")}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
