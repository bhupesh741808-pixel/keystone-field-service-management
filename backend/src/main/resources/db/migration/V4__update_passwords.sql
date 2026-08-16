-- Update default passwords from 'password' to a secure, unique password ('KeystoneFSM_Pass2026_Secure!') to prevent browser data breach warnings
UPDATE users
SET password = '$2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O'
WHERE password = '$2b$10$MnaFvYNKnwbjFCJlyV.Mbe4WPrFby4zW/dSi/fxpyXd84rz6O4ySa';
