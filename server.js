const express = require('express');
const { body, validationResult } = require('express-validator');
const repositories = require('./repositories');
const {
    toProfileInput,
    toTechnologyInput,
    toProjectInput,
    toFeedbackInput,
    toProfileResponse,
    toTechnologyResponse,
    toProjectResponse,
    toFeedbackResponse
} = require('./dtos');

const app = express();

const PORT = 3000;

app.use(express.json());

// Rota inicial
app.get('/', (req, res) => {
    res.json({
        message: 'DevShowcase API funcionando!'
    });
});

// POST /api/profiles - Criar perfil
app.post(
    '/api/profiles',
    [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('O nome é obrigatório.'),

        body('email')
            .trim()
            .isEmail()
            .withMessage('Informe um e-mail válido.'),

        body('avatarUrl')
            .optional({ checkFalsy: true })
            .trim()
            .isURL({ protocols: ['http', 'https'], require_protocol: true })
            .withMessage('Informe uma URL de avatar válida.')
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const data = toProfileInput(req.body);

        try {
            const profile = await repositories.createProfile(data);

            return res.status(201).json(toProfileResponse(profile));
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    message: 'Este e-mail já está cadastrado.'
                });
            }

            console.error(error);

            return res.status(500).json({
                message: 'Erro interno ao criar o perfil.'
            });
        }
    }
);

// GET /api/profiles/:id - Consultar perfil por ID
app.get('/api/profiles/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'ID inválido.'
        });
    }

    try {
        const profile = await repositories.findProfileById(id);

        if (!profile) {
            return res.status(404).json({
                message: 'Perfil não encontrado.'
            });
        }

        return res.json(toProfileResponse(profile));
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Erro interno ao consultar o perfil.'
        });
    }
});

// POST /api/technologies - Cadastrar tecnologia
app.post(
    '/api/technologies',
    [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('O nome da tecnologia é obrigatório.')
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const data = toTechnologyInput(req.body);

        try {
            const technology = await repositories.createTechnology(data);

            return res.status(201).json(toTechnologyResponse(technology));
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    message: 'Esta tecnologia já está cadastrada.'
                });
            }

            console.error(error);

            return res.status(500).json({
                message: 'Erro interno ao cadastrar a tecnologia.'
            });
        }
    }
);

// GET /api/technologies - Listar tecnologias
app.get('/api/technologies', async (req, res) => {
    try {
        const technologies = await repositories.listTechnologies();

        return res.json(technologies.map(toTechnologyResponse));
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Erro interno ao consultar as tecnologias.'
        });
    }
});

// POST /api/projects - Cadastrar projeto
app.post(
    '/api/projects',
    [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('O título do projeto é obrigatório.'),

        body('url')
            .trim()
            .isURL({ protocols: ['http', 'https'], require_protocol: true })
            .withMessage('Informe uma URL válida.'),

        body('profileId')
            .isInt({ min: 1 })
            .withMessage('Informe um ID de perfil válido.'),

        body('technologyIds')
            .optional()
            .isArray()
            .withMessage('technologyIds deve ser uma lista de IDs.'),

        body('technologyIds.*')
            .isInt({ min: 1 })
            .withMessage('Cada ID de tecnologia deve ser um número válido.')
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const data = toProjectInput(req.body);

        try {
            const project = await repositories.createProject(data);

            return res.status(201).json(toProjectResponse(project));
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    message: 'Perfil ou tecnologia não encontrada.'
                });
            }

            console.error(error);

            return res.status(500).json({
                message: 'Erro interno ao cadastrar o projeto.'
            });
        }
    }
);

// GET /api/projects - Listar projetos
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await repositories.listProjects();

        return res.json(projects.map(toProjectResponse));
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Erro interno ao consultar os projetos.'
        });
    }
});

// POST /api/projects/:id/feedbacks - Cadastrar feedback
app.post(
    '/api/projects/:id/feedbacks',
    [
        body('author')
            .trim()
            .notEmpty()
            .withMessage('O nome do autor é obrigatório.'),

        body('comment')
            .trim()
            .notEmpty()
            .withMessage('O comentário é obrigatório.')
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const projectId = Number(req.params.id);

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                message: 'ID do projeto inválido.'
            });
        }

        const { author, comment } = toFeedbackInput(req.body);

        try {
            const feedback = await repositories.createFeedback({
                projectId,
                author,
                comment
            });

            return res.status(201).json(toFeedbackResponse(feedback));
        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({
                    message: 'Projeto não encontrado.'
                });
            }

            console.error(error);

            return res.status(500).json({
                message: 'Erro interno ao cadastrar o feedback.'
            });
        }
    }
);

app.listen(PORT, (error) => {
    if (error) {
        console.error('Erro ao iniciar o servidor:', error.message);
        return;
    }

    console.log(`Servidor rodando em http://localhost:${PORT}`);
});