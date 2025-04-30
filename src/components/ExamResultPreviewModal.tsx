import { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ExamResultPreviewModalProps {
  open: boolean;
  onClose: () => void;
  totalPoints: number;
  questionCount: number;
}

const ExamResultPreviewModal: FC<ExamResultPreviewModalProps> = ({ open, onClose, totalPoints, questionCount }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Result Screen Preview</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-2">You have completed the exam!</p>
          <p className="mb-2">Total Questions: {questionCount}</p>
          <p className="mb-2">Total Points: {totalPoints}</p>
          <p className="mb-2">Your score will be calculated automatically based on your answers.</p>
        </div>
        <Button onClick={onClose} className="w-full">Close</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ExamResultPreviewModal;
