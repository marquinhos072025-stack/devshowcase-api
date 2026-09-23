// =====================================================
// DTOs de ENTRADA: escolhem e normalizam só os campos
// que a API aceita receber no corpo da requisição.
// =====================================================

function toProfileInput(body) {
    return {
        name: body.name,
        email: body.email,
        bio: body.bio || null,
        avatarUrl: body.avatarUrl || null
    };
}

function toTechnologyInput(body) {
    return {
        name: body.name
    };
}

function toProjectInput(body) {
    return {
        title: body.title,
        description: body.description || null,
        url: body.url,
        profileId: Number(body.profileId),
        technologyIds: [...new Set((body.technologyIds || []).map(Number))]
    };
}

function toFeedbackInput(body) {
    return {
        author: body.author,
        comment: body.comment
    };
}

// =====================================================
// DTOs de SAÍDA: definem exatamente o que a API devolve.
// =====================================================

function toTechnologyResponse(technology) {
    return {
        id: technology.id,
        name: technology.name
    };
}

function toFeedbackResponse(feedback) {
    return {
        id: feedback.id,
        author: feedback.author,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        projectId: feedback.projectId
    };
}

// Versão resumida do perfil (usada dentro de projetos, sem e-mail)
function toProfileSummaryResponse(profile) {
    return {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl
    };
}

function toProjectResponse(project) {
    const response = {
        id: project.id,
        title: project.title,
        description: project.description,
        url: project.url,
        createdAt: project.createdAt,
        profileId: project.profileId
    };

    if (project.profile) {
        response.profile = toProfileSummaryResponse(project.profile);
    }

    if (project.technologies) {
        response.technologies = project.technologies.map(toTechnologyResponse);
    }

    if (project.feedbacks) {
        response.feedbacks = project.feedbacks.map(toFeedbackResponse);
    }

    return response;
}

function toProfileResponse(profile) {
    const response = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt
    };

    if (profile.projects) {
        response.projects = profile.projects.map(toProjectResponse);
    }

    return response;
}

module.exports = {
    toProfileInput,
    toTechnologyInput,
    toProjectInput,
    toFeedbackInput,
    toProfileResponse,
    toTechnologyResponse,
    toProjectResponse,
    toFeedbackResponse
};