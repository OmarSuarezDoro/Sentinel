/**
 * @file: auth.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo auth
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import * as service from "./auth.service.js";
export const login: RequestHandler = async (req, res) => {
  const { token, ...data } = await service.login(req.user!);
  res
    .cookie("session", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "strict",
      maxAge: 28800000,
      path: "/",
    })
    .json({ data });
};
export const me: RequestHandler = (req: any, res) => {
  res.json({
    data: {
      csrf: req.session.csrf,
      user: { id: req.user.id, name: req.user.name, role: req.user.role },
    },
  });
};
export const logout: RequestHandler = async (req: any, res) => {
  await service.logout(req.session.id, req.user.id);
  res.clearCookie("session", { path: "/" }).json({ data: true });
};
