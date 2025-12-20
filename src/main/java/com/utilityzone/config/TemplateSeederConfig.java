package com.utilityzone.config;
import com.utilityzone.model.TemplateDescription;
import com.utilityzone.repository.TemplateDescriptionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.*;

@Configuration
public class TemplateSeederConfig {
    private static final String MASTER_TEMPLATE =
        "✨ Editable {{style}} {{eventType}} Invitation – Canva Template ({{buyerPdfType}} | Instant Download)\n\n" +
        "Celebrate your {{eventType}} with this beautifully designed {{style}} invitation, perfect for {{audience}} audiences in {{region}}.\n\n" +
        "--------------------------------------------------\n\n" +
        "WHAT YOU WILL RECEIVE ({{buyerPdfType}})\n\n" +
        "• Editable {{eventType}} Invitation – Canva Template\n" +
        "• Buyer PDF with Canva access link & instructions\n\n" +
        "--------------------------------------------------\n\n" +
        "EDITING DETAILS\n\n" +
        "• Text is fully editable\n" +
        "• Select design elements adjustable\n" +
        "• Background and main illustrations fixed\n" +
        "• Edit in Canva (free account)\n\n" +
        "--------------------------------------------------\n\n" +
        "LICENSE & USAGE\n\n" +
        "• Personal use only\n" +
        "• Valid for one {{eventType}} event\n" +
        "• Resale or redistribution not allowed\n";

    @Bean
    public CommandLineRunner seedMasterTemplate(TemplateDescriptionRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                List<String> events = List.of("Wedding","Birthday","Reception");
                List<String> buyerTypes = List.of("Print Only","Print & Mobile","Invite Suite");
                List<String> styles = List.of("Traditional","Minimal","Floral","Modern","Kids","Other");
                List<String> audiences = List.of("Kids","Adults","All");
                List<String> regions = List.of("India","Other Countries");

                List<TemplateDescription> entities = new ArrayList<>();

                for (String e : events)
                    for (String b : buyerTypes)
                        for (String s : styles)
                            for (String a : audiences)
                                for (String r : regions) {
                                    TemplateDescription t = new TemplateDescription();
                                    t.setEventType(e);
                                    t.setBuyerPdfType(b);
                                    t.setStyle(s);
                                    t.setAudience(a);
                                    t.setRegion(r);
                                    t.setTemplateBody(MASTER_TEMPLATE);
                                    entities.add(t);
                                }

                repository.saveAll(entities);
            }
        };
    }
}
