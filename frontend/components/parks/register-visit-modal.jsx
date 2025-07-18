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

// Modal de registro de visita actualizado con más campos.
export function RegisterVisitModal({ parkName, children }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("")
  const { toast } = useToast()

  const handleRegister = () => {
    if (!date || !time || !duration) {
      toast({
        title: "Faltan datos",
        description: "Por favor, completa fecha, hora y duración.",
        variant: "destructive",
      })
      return
    }
    console.log(`Registrando visita a ${parkName} para el ${date} a las ${time} por ${duration}.`)
    toast({
      title: "¡Visita registrada!",
      description: `Agendaste tu visita a ${parkName}.`,
    })
    setOpen(false)
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
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right text-base">
              Hora *
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3 h-11 text-base"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right text-base">
              Duración *
            </Label>
            <Select onValueChange={setDuration}>
              <SelectTrigger className="col-span-3 h-11 text-base">
                <SelectValue placeholder="Duración estimada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 minutos">30 minutos</SelectItem>
                <SelectItem value="1 hora">1 hora</SelectItem>
                <SelectItem value="1 hora y media">1 hora y media</SelectItem>
                <SelectItem value="2 horas">2 horas</SelectItem>
                <SelectItem value="3 horas">3 horas</SelectItem>
                <SelectItem value="Más de 3 horas">Más de 3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right text-base pt-2">
              Notas
            </Label>
            <Textarea id="notes" placeholder="¿Algo que agregar? Ej: 'Llevaré juguetes'" className="col-span-3" />
          </div>
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="lg">
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleRegister} size="lg">
            Registrar Visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
