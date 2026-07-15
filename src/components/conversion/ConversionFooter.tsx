import * as React from "react";
import { Container } from "@/components/ui/container";
import { Heading, Text } from "@/components/ui/typography";
import { CallCTA, DirectionsCTA, BookingCTA } from "./ctas";
import type { BusinessConfig } from "@/types";

/**
 * Conversion-oriented footer: contact, hours, address and the primary CTAs, all
 * driven by the business config (verified facts only — no invented data).
 */
export function ConversionFooter({ business }: { business: BusinessConfig }) {
  const { name, telephone, email, address, geo, openingHours } = business;
  return (
    <footer className="border-border bg-surface-2 border-t py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Heading level="h4" as="h2">
              {name}
            </Heading>
            {address && (
              <address className="text-muted text-sm not-italic">
                {[address.streetAddress, address.postalCode, address.addressLocality]
                  .filter(Boolean)
                  .join(", ")}
              </address>
            )}
            {email && (
              <a href={`mailto:${email}`} className="text-brand text-sm hover:underline">
                {email}
              </a>
            )}
          </div>

          {openingHours && openingHours.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text weight="semibold">Horaires</Text>
              <ul className="text-muted text-sm">
                {openingHours.map((h, i) => (
                  <li key={i}>
                    {h.dayOfWeek.join(", ")} : {h.opens}–{h.closes}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col items-start gap-3">
            <Text weight="semibold">Nous contacter</Text>
            <div className="flex flex-wrap gap-2">
              {telephone && <CallCTA phone={telephone} />}
              {(geo || address) && (
                <DirectionsCTA
                  lat={geo?.latitude}
                  lng={geo?.longitude}
                  query={address ? `${name} ${address.addressLocality ?? ""}` : name}
                />
              )}
              <BookingCTA />
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
