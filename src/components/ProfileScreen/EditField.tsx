import { useMachines } from "#/providers/MachineProvider";
import { Box, Divider, IconButton, ListItem, ListItemText, TextField, CircularProgress, MenuItem } from "@mui/material"

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type EditFieldOption = {
  label: string;
  value: string;
};

type EditFieldProps={
  label:string;
  value:any;
  isEditing:boolean;
  toggleKey:string;
  fieldKey: string; // Nueva prop para identificar el campo
  onChange: (val: string) => void;
  maxLength?: number; // Límite de caracteres
  options?: EditFieldOption[];
  displayValue?: React.ReactNode;
}

const MotionBox = motion.create(Box);

const EditField :React.FC<EditFieldProps>= ({label, value, isEditing, toggleKey, fieldKey, onChange, maxLength, options, displayValue})=>{
    const { uiSend, profileState, profileSend } = useMachines();
    const profileContext = profileState?.context;
    const formErrors = profileContext?.formErrors ?? {};

    const editingValue = isEditing && profileContext?.formValues
      ? (profileContext.formValues as Record<string, unknown>)[fieldKey]
      : undefined;
    const currentValue = editingValue ?? value;
    const normalizedValue = currentValue === null || currentValue === undefined ? "" : String(currentValue);
    const fieldError = formErrors[fieldKey] ?? "";
    const isUpdating = profileContext?.updatingProfile;
    const hasAnyError = Object.values(formErrors).some((error) => Boolean(error));
    const hasError = Boolean(fieldError);
    const usesOptions = Array.isArray(options) && options.length > 0;
    const computedLength = (() => {
      if (usesOptions || normalizedValue === "") {
        return 0;
      }
      return normalizedValue.length;
    })();
    const helperText = fieldError || (!usesOptions && maxLength ? `${computedLength}/${maxLength} caracteres` : undefined);

    const handleChange = (newValue: string) => {
      if (maxLength && newValue.length > maxLength) {
        return; // Don't update if exceeds limit
      }
      onChange(newValue);
    };

    const handleSave = () => {
      if (hasAnyError) {
        return;
      }
      profileSend({ type: "UPDATE_PROFILE" });
      uiSend({type: "TOGGLE", key: toggleKey});
    };

    const handleCancel = () => {
      profileSend({ type: "CANCEL_PROFILE_EDIT", key: fieldKey });
      uiSend({type: "TOGGLE", key: toggleKey});
    };
    
    return(
        <>
        <ListItem
          sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
        }}
        >
        <AnimatePresence mode="wait" initial={false}>
          {isEditing ? (
            <MotionBox key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              sx={{ flex: 1, mr: 1 }}>
                <TextField
                  label={label}
                  value={normalizedValue}
                  onChange={(e) => handleChange(e.target.value)}
                  size="small"
                  fullWidth
                  select={usesOptions}
                  helperText={helperText}
                  error={hasError}
                >
                  {usesOptions && options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </MotionBox>
              ) : (
                <MotionBox
                  key="view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  sx={{ flex: 1, mr: 1 }}
                >
                  <ListItemText primary={label} secondary={displayValue ?? value} />
                </MotionBox>
              )}
        </AnimatePresence>
          <Box>
            {isEditing ? (
              <>
                <IconButton onClick={handleSave} disabled={isUpdating || hasAnyError}>
                  {isUpdating ? <CircularProgress size={20} /> : <CheckIcon color="success" />}
                </IconButton>
                <IconButton onClick={handleCancel} disabled={isUpdating}>
                  <CloseIcon color="error" />
                </IconButton>
              </>
            ) : (
              <IconButton onClick={() => uiSend({type: "TOGGLE", key:toggleKey})} disabled={isUpdating}>
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </ListItem>
        <Divider component="li" />
        </>
    )
 }
 export default EditField;