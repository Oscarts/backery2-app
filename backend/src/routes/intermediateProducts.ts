import { Router } from 'express';

// Deprecated route stub – intermediate products feature removed
const router = Router();

router.all('*', (_req, res) => {
	res.status(410).json({
		success: false,
		error: 'Intermediate products feature deprecated'
	});
});

export default router;
