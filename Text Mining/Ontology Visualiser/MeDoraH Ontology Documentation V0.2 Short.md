## MeDoraH Class hierarchy (rooted at `medorah:Entity`)

`medorah:Entity` — anything referable in the narratives (people, orgs, events, artefacts, concepts, places, times, analytic properties).

- `Actor` — agent capable of intentional action/participation.
	- `Person` — individual human agent/narrator/subject.
	- `Organisation` — formally recognised institutional actor.
	- `Group` — loosely bounded collective (committee, informal network).
- `Event` — temporal occurrence in which actors participate; can be anchored in time/space.
	- `Project` — **Organised, sustained research/engineering activity** (often funded), carried out by actors over time; **outputs are modelled as separate `Artefact` instances**.
	- `CourseAndProgramme` — formal education/training activity.
	- `Conference` — organised scholarly meeting/event.
	- `EventSeries` — recurring named series; instances can be linked via `isPartOf`.
	- `Activity` — bounded activity (meeting, workshop, training session, sprint).
- `Artefact` — anything created/used/depended on in DH practice (technology or work/resource).
	- `Technology` — technical artefact enabling practice.
	- `Software`
	- `Hardware`
	- `Standard`
	- `Infrastructure`
- `Work` — informational output/resource that can be authored/published/curated/used/cited/integrated.
	- `InformationResource`
	- `Publication`
	- `Corpus`
	- `Database`
	- `Dataset`
	- `Website`
- `ConceptualItem` — immaterial construct used to organise/interpret/generate knowledge (theories, methods, disciplines).
	- `ConceptualFramework` — conceptual apparatus (theory/paradigm/school/definition).
		- `Theory`
		- `Paradigm`
		- `SchoolOfThought`
		- `Definition`
	- `Methodology` — methods/practices/techniques.
		- `Method`
		- `Practice`
		- `Technique`
	- `Discipline` — disciplines/fields/research areas.
		- `AcademicDiscipline`
		- `FieldOfStudy`
		- `ResearchArea`
- `SpatialEntity` — place.
- `TemporalEntity` — time expression/interval (year, decade, period, date range).
- `Property` — analytic classification/credential attached to actors.
	- `RoleOrPosition`
	- `Qualification`

## Relation inventory (top-level patterns and their specialisations)

The ontology is intentionally organised as a small set of extraction-friendly relation patterns (Actor–Actor, Actor–Artefact, etc.).

1. `Actor → Actor`: `hasSocioInstitutionalRelationWith`— general socio-institutional relationship; specialised by sub-properties.
- `hasEmploymentAt` (`Person` → `Organisation`) — employment.
- `studiedAt` (`Person` → `Organisation`) — formal study.
- `hasEducationIn` (`Person` → `Organisation`) — broader education context.
- `founded` (`Person` → `Organisation`) — founding an organisation.
- `collaboratedWith` (`Person` → `Person`) — collaboration.
- `mentorsOrSupervises` (`Person` → `Person`) — mentoring/supervision.
- `influences` (`Person` → `Person`) — person-to-person influence.
- `providesResource` (`Actor` → `Actor`) — resource/service/support provision.
- `chairOf` (`Person` → `Organisation`) — chairs an organisation/committee.
- `represents` (`Person` → `Organisation`) — representation.
- `affiliatedWith` (`Person` → `Organisation`) — affiliation.
- `mergedWith` (`Organisation` → `Organisation`) — organisational merge.

2. `Actor → Artefact`: `createsItem`— actor creates/brings an artefact into existence; inverse `createdBy`.
- `authorsWork` (`Actor` → `Work`) — authorship.
- `publishesWork` (`Actor` → `Work`) — publishing.
- `developsTech` (`Actor` → `Technology`) — develops technology.
- `createsArtefact` (`Actor` → `Artefact`) — generic artefact creation.
- `uses` (intended  `Actor` → `Artefact` or  `Project` → `Artefact` ) — uses/employs an artefact; inverse `usedBy`.
- `usesTechnology` (`Actor` or `Project` → `Technology`) — uses a technology.
- `usesCorpusOrResource` (`Actor` or `Project` → `Work`) — uses a corpus/resource/work.
* `projectUse` (`Project → Artefact`)  — project uses artefact (e.g, Technology/Software/Platform, etc) Implementation note: to avoid union-range complexity, you can constrain to `Project` and represent organisation venues via relation between `Person` and `Project` or a specialised property.

4. `Actor → ConceptualItem`: engagement with disciplines/methods/definitions
`engagesWithConcept` (`Actor` → `ConceptualItem`) — engagement with conceptual items via working/studying/developing/defining.
  - `workInField` (`Actor` → `Discipline`) — worked/taught/supported a discipline.
  - `studiesField` (`Actor` → `Discipline`) — studied in a discipline.
  - `coinsOrDefinesTerm` (`Person` → `Definition`) — coins/defines a term/definition.

5. `Actor → Event`: participation/organisation/presentation/funding
 `engagesIn` (`Actor` → `Event`) — involvement in events; inverse `isEngagedInBy`.
  - `participatesIn` (`Actor` → `Event`) — attendance/participation/training.
  - `organises` (`Actor` → `Event`) — organises/provides event.
  - `presentedAt` (`Actor` → `Event`) — presents at event.
  - `funds` (`Actor` → `Event`) — funds event.

6. `Actor → Property`: roles/qualifications
`hasProperty` (`Actor` → `Property`) — attaches analytic properties (roles/qualifications); inverse `isPropertyOf`.
  - `hasRoleOrPosition` (`Actor` → `RoleOrPosition`) — actor holds a role/position.
  - (recommended) `hasQualification` (`Actor` → `Qualification`) — explicit qualification link (optional refinement).

7. `Event → SpatialEntity|Organisation`: location anchoring
- `takesPlaceAt` (`Event` → intended `SpatialEntity` or `Organisation`) — links an event to its location (place or organisation-as-venue).
  Implementation note: to avoid union-range complexity, you can constrain to `SpatialEntity` and represent organisation venues via `Organisation locatedIn Place` or a specialised property.

8. `Event → TemporalEntity`: time anchoring
- `hasTimeExtent` (`Event` → `TemporalEntity`) — links an event to its time interval/date/period.

9. `Entity → Entity`: `dependency` (`Entity` → `Entity`) — generic dependency (part–whole, conceptual influence, software–hardware relations).
  - `isPartOf` (`Entity` → `Entity`) — part–whole.
  - `conceptuallyInfluences` (`ConceptualItem` → `ConceptualItem`) — concept-to-concept influence.
  - `runsOn` (`Software` → `Hardware`) — software runs on hardware.

10. `Artefact → ConceptualItem`: `about` (`Artefact` → `ConceptualItem`) — connects artefacts to concepts they are about/implement/operationalise.
  - `hasTopic` (`Work` → `Discipline`) — topical aboutness (discipline/field/topic).
  - `implementsConcept` (`Artefact` → `ConceptualItem`) — implements a concept/method/framework.

11. `Actor → SpatialEntity`: `hasResidence` (`Actor` → `SpatialEntity`) — associates an actor with residence/upbringing/work/org location.
  - `residesIn` (`Person` → `SpatialEntity`) — residence.
  - `grewUpIn` (`Person` → `SpatialEntity`) — upbringing (often an administrative area).
  - `workedIn` (`Person` → `SpatialEntity`) — work location.
  - `locatedIn` (`Organisation` → `SpatialEntity`) — organisational location.

​	