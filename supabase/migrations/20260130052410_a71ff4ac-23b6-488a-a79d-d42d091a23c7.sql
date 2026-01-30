-- Add notice_type to distinguish between notices and meeting minutes
ALTER TABLE public.notices ADD COLUMN notice_type text NOT NULL DEFAULT 'notice';

-- Add constraint for valid types
ALTER TABLE public.notices ADD CONSTRAINT valid_notice_type CHECK (notice_type IN ('notice', 'meeting_minutes'));

-- Update existing notices to be of type 'notice'
UPDATE public.notices SET notice_type = 'notice' WHERE notice_type IS NULL;