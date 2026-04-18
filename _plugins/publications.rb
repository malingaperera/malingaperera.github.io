require "bibtex"

module Malinga
  class PublicationData < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      path = site.in_source_dir("_bibliography", "papers.bib")
      return unless File.exist?(path)

      content = File.read(path, encoding: "UTF-8").sub(/\A---\s*\n---\s*\n/m, "")
      entries = BibTeX.parse(content).entries.values

      publications = entries.map { |entry| publication_for(entry) }.compact
      publications.sort_by! { |publication| [-publication["year"].to_i, publication["title"].to_s] }

      site.data["publications"] = publications
      site.data["publications_by_key"] = publications.each_with_object({}) do |publication, index|
        index[publication["key"]] = publication
      end
    end

    private

    def publication_for(entry)
      year = field(entry, :year)
      title = field(entry, :title)
      return if year.nil? || title.nil?

      doi = clean_doi(field(entry, :doi))
      arxiv = arxiv_for(entry)
      url = field(entry, :url) || field(entry, :html)
      url = nil if doi && url&.match?(%r{\Ahttps?://(?:dx\.)?doi\.org/#{Regexp.escape(doi)}\z}i)
      url = nil if arxiv && url&.match?(%r{\Ahttps?://arxiv\.org/(?:abs|pdf)/#{Regexp.escape(arxiv)}(?:\.pdf)?\z}i)

      {
        "key" => entry.key.to_s,
        "id" => entry.key.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-+\z/, ""),
        "type" => entry.type.to_s,
        "title" => title,
        "year" => year.to_i,
        "authors" => authors_for(entry),
        "venue" => venue_for(entry),
        "details" => details_for(entry),
        "abstract" => field(entry, :abstract),
        "doi" => doi,
        "url" => url,
        "pdf" => field(entry, :pdf),
        "code" => field(entry, :code),
        "blog" => field(entry, :blog),
        "website" => field(entry, :website),
        "arxiv" => arxiv,
        "selected" => truthy?(field(entry, :selected)),
        "bibtex" => clean_bibtex(entry.to_s.strip)
      }
    end

    def authors_for(entry)
      names = entry[:author]
      return [] unless names

      names.map do |name|
        first = name.respond_to?(:first) ? name.first.to_s.strip : ""
        last = name.respond_to?(:last) ? name.last.to_s.strip : ""
        full_name = [first, last].reject(&:empty?).join(" ")
        full_name = clean_text(name.to_s) if full_name.empty?

        {
          "name" => clean_text(full_name),
          "self" => last.casecmp("Perera").zero? && first.include?("Malinga")
        }
      end
    end

    def venue_for(entry)
      field(entry, :journal) || field(entry, :booktitle) || field(entry, :publisher)
    end

    def details_for(entry)
      details = []
      volume = field(entry, :volume)
      number = field(entry, :number)
      pages = field(entry, :pages)
      month = field(entry, :month)

      if volume && number
        details << "Vol. #{volume}, No. #{number}"
      elsif volume
        details << "Vol. #{volume}"
      end

      details << month.capitalize if month
      details << "pp. #{pages}" if pages
      details
    end

    def arxiv_for(entry)
      eprinttype = field(entry, :eprinttype)
      eprint = field(entry, :eprint)
      return eprint if eprinttype&.downcase == "arxiv" && eprint

      url = field(entry, :url)
      return Regexp.last_match(1).sub(/\.pdf\z/i, "") if url&.match(%r{arxiv\.org/(?:abs|pdf)/([^/?#]+)})

      nil
    end

    def field(entry, name)
      value = entry[name]
      return nil if value.nil?

      text = clean_text(value.to_s)
      text.empty? ? nil : text
    end

    def clean_text(text)
      normalize_text(text)
        .gsub(/\s+/, " ")
        .gsub('\%', "%")
        .gsub("{", "")
        .gsub("}", "")
        .gsub("--", "-")
        .strip
    end

    def clean_bibtex(text)
      normalize_text(text)
        .gsub('\%', "%")
        .strip
    end

    def normalize_text(text)
      text = repair_mojibake(text.to_s)
      text
        .gsub(/\u2014|\u2013/, "-")
        .gsub(/\u201C|\u201D/, '"')
        .gsub(/\u2018|\u2019/, "'")
        .gsub(/\u03F5/, "epsilon")
        .gsub(/\u00A0/, " ")
    end

    def repair_mojibake(text)
      return text unless text.match?(/[\u00C3\u00E2\u00CF]/)

      repaired = text.encode("Windows-1252").force_encoding("UTF-8")
      repaired.valid_encoding? ? repaired : text
    rescue Encoding::UndefinedConversionError, Encoding::InvalidByteSequenceError
      text
    end

    def clean_doi(doi)
      doi&.sub(%r{\Ahttps?://(?:dx\.)?doi\.org/}i, "")
    end

    def truthy?(value)
      %w[true yes 1 selected].include?(value.to_s.downcase)
    end
  end
end
