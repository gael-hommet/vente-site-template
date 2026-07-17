"use client";

import * as React from "react";
import { LeadForm } from "@/components/conversion/LeadForm";
import { BookingCTA, DirectionsCTA } from "@/components/conversion/ctas";
import { Spinner, LoadingState, Skeleton, ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

/**
 * Conversion & UI states showcase: the real LeadForm (local simulated
 * delivery), the CTA set, accessible overlays (dialog/drawer — the "menus"
 * building blocks) and every UI state (loading, skeleton, empty, error).
 */
export function ConversionShowcase() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <p className="mb-4 font-semibold">Formulaire de lead (envoi local simulé)</p>
        <LeadForm />
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col items-start gap-3 p-6">
          <p className="font-semibold">CTA & superpositions accessibles</p>
          <div className="flex flex-wrap gap-2">
            <BookingCTA fallbackHref="#ace-conversion" />
            <DirectionsCTA query="mairie de Paris" label="Itinéraire (démo)" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Ouvrir un dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Dialog accessible</DialogTitle>
                <DialogDescription>
                  Focus piégé, fermeture clavier (Échap), restitution du focus — via Radix.
                </DialogDescription>
                <DialogClose asChild>
                  <Button size="sm" className="mt-4">
                    Fermer
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  Ouvrir un drawer
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerTitle>Drawer (menu mobile)</DrawerTitle>
                <p className="text-muted mt-2 text-sm">
                  Le même socle sert au menu mobile de navigation.
                </p>
                <DrawerClose asChild>
                  <Button size="sm" className="mt-4">
                    Fermer
                  </Button>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          </div>
          <p className="text-muted text-xs">
            Le CTA sticky mobile est monté globalement (visible sur viewport mobile). Aucune
            coordonnée réelle : démos uniquement.
          </p>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <p className="font-semibold">États UI</p>
          <div className="flex items-center gap-6">
            <Spinner label="Spinner" />
            <div className="flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <LoadingState label="Chargement (bloc)" />
          <ErrorState
            title="Erreur (démo)"
            description="Panneau d'erreur accessible avec action de reprise."
            onRetry={() => {}}
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">Badge brand</Badge>
            <Badge variant="neutral">Badge neutre</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
