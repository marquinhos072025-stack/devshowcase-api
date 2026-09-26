const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const dtos = require('./dtos');

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// =====================================================
// CONFIGURAÇÃO DO SWAGGER (DOCUMENTAÇÃO INTERATIVA)
// =====================================================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DevShowcase API',
            version: '1.0.0',
            description: 'Documentação interativa da API DevShowcase - Etapa Final',
            contact: { name: 'Marcos, Adriano e Washington' }
        },
        servers: [{ url: 'http://localhost:3000', description: 'Servidor Local' }]
    },
    apis: ['./server.js']
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// =====================================================
// ENDPOINTS E ROTAS
// =====================================================

/**
 * @openapi
 * /api/projects:
 *   get:
 *     summary: Lista projetos com paginação e filtro por tecnologia
 *     responses:
 *       200:
 *         description: Sucesso
 */
app.get('/api/projects', [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
    query('tech').optional().isString()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const page = req.query.page || 1;
        const limit = req.query.limit || 5;
        const skip = (page - 1) * limit;
        const techName = req.query.tech;

        const whereClause = techName ? {
            technologies: { some: { name: { equals: techName, mode: 'insensitive' } } }
        } : {};

        const projects = await prisma.project.findMany({
            where: whereClause,
            skip: skip,
            take: limit,
            include: { profile: true, technologies: true, feedbacks: true }
        });

        res.json(projects.map(dtos.toProjectResponse));
    } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/projects/{id}/feedbacks:
 *   post:
 *     summary: Cadastra um feedback avaliativo e atualiza a média do projeto
 *     responses:
 *       201:
 *         description: Criado
 */
app.post('/api/projects/:id/feedbacks', [
    body('author').notEmpty().withMessage('O autor é obrigatório.'),
    body('comment').notEmpty().withMessage('O comentário é obrigatório.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('A nota deve ser um número inteiro de 1 a 5.')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const projectId = Number(req.params.id);
        const { author, comment, rating } = req.body;

        const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
        if (!projectExists) {
            const error = new Error('Projeto não encontrado.');
            error.status = 404;
            throw error;
        }

        const newFeedback = await prisma.feedback.create({
            data: { author, comment, rating, projectId }
        });

        const allFeedbacks = await prisma.feedback.findMany({ where: { projectId } });
        const sum = allFeedbacks.reduce((acc, f) => acc + f.rating, 0);
        const average = sum / allFeedbacks.length;

        await prisma.project.update({
            where: { id: projectId },
            data: { averageRating: parseFloat(average.toFixed(1)) }
        });

        res.status(201).json(dtos.toFeedbackResponse(newFeedback));
    } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/projects/{id}/upvote:
 *   put:
 *     summary: Incrementa o número de curtidas/estrelas do projeto
 *     responses:
 *       200:
 *         description: Atualizado com sucesso
 */
app.put('/api/projects/:id/upvote', async (req, res, next) => {
    try {
        const projectId = Number(req.params.id);

        const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
        if (!projectExists) {
            const error = new Error('Projeto não encontrado.');
            error.status = 404;
            throw error;
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { upvotes: { increment: 1 } },
            include: { profile: true, technologies: true, feedbacks: true }
        });

        res.json(dtos.toProjectResponse(updatedProject));
    } catch (err) { next(err); }
});

// Mantendo endpoints base necessários para criar os dados de testes
app.post('/api/profiles', [
    body('name').notEmpty(),
    body('email').isEmail()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const newProfile = await prisma.profile.create({ data: dtos.toProfileInput(req.body) });
        res.status(201).json(dtos.toProfileResponse(newProfile));
    } catch (err) { next(err); }
});

app.post('/api/technologies', [body('name').notEmpty()], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const newTech = await prisma.technology.create({ data: dtos.toTechnologyInput(req.body) });
        res.status(201).json(dtos.toTechnologyResponse(newTech));
    } catch (err) { next(err); }
});

app.post('/api/projects', [body('title').notEmpty(), body('url').isURL()], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { technologyIds, ...projectData } = dtos.toProjectInput(req.body);
        const newProj = await prisma.project.create({
            data: { ...projectData, technologies: { connect: technologyIds.map(id => ({ id })) } }
        });
        res.status(201).json(dtos.toProjectResponse(newProj));
    } catch (err) { next(err); }
});

// =====================================================
// 🛡️ TRATAMENTO GLOBAL DE EXCEÇÕES E ERROS (MIDDLEWARE)
// =====================================================
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    console.error(`[Erro na API]: ${err.message}`);
    
    res.status(statusCode).json({
        status: statusCode,
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: err.message || 'Ocorreu um erro interno inesperado no servidor.'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
