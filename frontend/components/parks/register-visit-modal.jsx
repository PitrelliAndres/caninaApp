"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { visitService } from "@/lib/api/visits"
import { useTranslation } from 'react-i18next'

export function RegisterVisitModal({ parkId, parkName, children, onSuccess }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRegister = async () => {
    if (!date || !time || !duration) {
      toast({
        title: "Faltan datos",
        description: "Por favor, completa fecha, hora y duración.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await visitService.createVisit({
        park_id: parkId,
        date,
        time,
        duration: parseInt(duration),
        notes
      })
      
      toast({
        title: "¡Visita registrada!",
        description: `Agendaste tu visita a ${parkName}.`,
      })
      
      setOpen(false)
      
      // Limpiar formulario
      setDate("")
      setTime("")
      setDuration("")
      setNotes("")
      
      // Callback opcional
      if (onSuccess) onSuccess()
    } catch (error) {
      toast({
        title: "Error al registrar visita",
        description: error.message || "Por favor intenta de nuevo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generar opciones de tiempo cada 10 minutos
  const timeOptions = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeStr)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Registrar visita a {parkName}</DialogTitle>
          <DialogDescription
            as="div"
            className="flex items-start gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-md"
          >
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Elige cuándo irás al parque. Esta información es privada y solo se usará para hacer match.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right text-base">
              Fecha *
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3 h-11 text-base"
              min={new Date().toISOString().split("T")[0]}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right text-base">
              Hora *
            </Label>
            <Select onValueChange={setTime} disabled={loading}>
              <SelectTrigger className="col-span-3 h-11 text-base">
                <SelectValue placeholder={t('visits.selectTime')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {timeOptions.map((timeOpt) => (
                  <SelectItem key={timeOpt} value={timeOpt}>
                    {timeOpt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right text-base">
              Duración *
            </Label>
            <Select onValueChange={setDuration} disabled={loading}>
              <SelectTrigger className="col-span-3 h-11 text-base">
                <SelectValue placeholder={t('visits.estimatedDuration')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1 hora y media</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
                <SelectItem value="240">Más de 3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right text-base pt-2">
              Notas
            </Label>
            <Textarea 
              id="notes" 
              placeholder="¿Algo que agregar? Ej: 'Llevaré juguetes'" 
              className="col-span-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="lg" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleRegister} size="lg" disabled={loading}>
            {loading ? t('visits.registering') : t('visits.registerVisit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
