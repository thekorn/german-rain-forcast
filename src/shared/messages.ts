import { v, message } from '@ws-kit/valibot';

export const Message = message('MESSAGE', {
  payload: v.string('This is a message'),
});

export const ErrorMessage = message('ERROR', {
  message: v.string(),
});
