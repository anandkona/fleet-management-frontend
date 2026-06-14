import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

export function Modal({ isOpen, title, description, onClose, footer, children }) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      {description && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>{description}</Typography>
        </DialogContent>
      )}
      <DialogContent sx={{ pt: description ? '0 !important' : undefined }}>
        {children}
      </DialogContent>
      {footer && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
}
