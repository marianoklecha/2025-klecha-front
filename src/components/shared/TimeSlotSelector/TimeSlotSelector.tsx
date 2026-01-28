import React from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Dayjs } from 'dayjs';
import { filterAvailableTimeSlots, formatTime } from '#/utils/dateTimeUtils';
import './TimeSlotSelector.css';

interface TimeSlotSelectorProps {
  selectedDate: Dayjs | null;
  availableSlots: string[];
  selectedTime: string | null;
  isLoadingSlots?: boolean;
  onTimeSelect: (timeSlot: string) => void;
  className?: string;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedDate,
  availableSlots,
  selectedTime,
  isLoadingSlots = false,
  onTimeSelect,
  className = ""
}) => {
  if (!selectedDate) {
    return (
      <Box className={`time-slot-empty-state ${className}`}>
        <Typography>📅 Primero selecciona una fecha</Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
          Elige una fecha en el calendario para ver los horarios disponibles
        </Typography>
      </Box>
    );
  }

  if (isLoadingSlots) {
    return (
      <Box className={`time-slot-loading ${className}`}>
        <CircularProgress size={24} />
        <Typography sx={{ mt: 1 }}>Cargando horarios disponibles...</Typography>
      </Box>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <Box className={`time-slot-empty-state ${className}`}>
        <Typography>
          No hay horarios disponibles para la fecha seleccionada
        </Typography>
      </Box>
    );
  }

  const filteredSlots = filterAvailableTimeSlots(availableSlots);

  return (
    <Box className={`time-slot-selector ${className}`}>
      <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: '#1e3a8a', fontWeight: 600 }}>
        {selectedDate.format("DD/MM/YYYY")}
      </Typography>
      <Box className="time-slot-grid">
        {filteredSlots.map((timeSlot: string, index: number) => (
          <Button
            key={index}
            className={`time-slot-button ${selectedTime === timeSlot ? 'selected' : ''}`}
            onClick={() => onTimeSelect(timeSlot)}
            variant={selectedTime === timeSlot ? 'contained' : 'outlined'}
          >
            <Typography variant="body1" component="span" sx={{ fontWeight: 600 }}>
              {formatTime(timeSlot)}
            </Typography>
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default TimeSlotSelector;