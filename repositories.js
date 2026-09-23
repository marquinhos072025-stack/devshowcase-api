const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// =====================================================
// Repositório de Perfis
// =====================================================

function createProfile(data) {
    return prisma.profile.create({
        data
    });
}

function findProfileById(id) {
    return prisma.profile.findUnique({
        where: { id },
        include: {
            projects: true
        }
    });
}

// =====================================================
// Repositório de Tecnologias
// =====================================================

function createTechnology(data) {
    return prisma.technology.create({
        data
    });
}

function listTechnologies() {
    return prisma.technology.findMany({
        orderBy: {
            id: 'asc'
        }
    });
}

// =====================================================
// Repositório de Projetos
// =====================================================

function createProject({ title, description, url, profileId, technologyIds }) {
    return prisma.project.create({
        data: {
            title,
            description,
            url,
            profile: {
                connect: {
                    id: profileId
                }
            },
            technologies: {
                connect: technologyIds.map(id => ({ id }))
            }
        },
        include: {
            profile: true,
            technologies: true
        }
    });
}

function listProjects() {
    return prisma.project.findMany({
        include: {
            profile: true,
            technologies: true,
            feedbacks: true
        },
        orderBy: {
            id: 'asc'
        }
    });
}

// =====================================================
// Repositório de Feedbacks
// =====================================================

function createFeedback({ projectId, author, comment }) {
    return prisma.feedback.create({
        data: {
            author,
            comment,
            project: {
                connect: {
                    id: projectId
                }
            }
        }
    });
}

module.exports = {
    createProfile,
    findProfileById,
    createTechnology,
    listTechnologies,
    createProject,
    listProjects,
    createFeedback
};