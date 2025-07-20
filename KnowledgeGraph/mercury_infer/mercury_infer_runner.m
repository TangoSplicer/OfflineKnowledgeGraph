o:- module mercury_infer_runner.
:- interface.
:- import_module io.

:- pred main(io::di, io::uo) is det.

%----------------------------------------
:- implementation.

:- import_module string, list, json, io, facts, plugin.

:- func json_to_fact(json.value) = facts.fact.
json_to_fact(J) = F :-
    J = json.object(Pairs),
    F = fact(
        entity(string.det_from_maybe(string.get(json.lookup(Pairs, "subject")))),
        relation(string.det_from_maybe(string.get(json.lookup(Pairs, "predicate")))),
        entity(string.det_from_maybe(string.get(json.lookup(Pairs, "object"))))
    ).

:- func fact_to_json(fact, bool) = json.value.
fact_to_json(fact(entity(S), relation(P), entity(O)), Conflict) =
    json.object([
        "subject" - json.string(S),
        "predicate" - json.string(P),
        "object" - json.string(O),
        "conflict" - json.bool(Conflict)
    ]).

main(!IO) :-
    io.read_file_as_string("mercury_input.json", Result, !IO),
    ( if Result = ok(InputStr),
         json.read_string(InputStr, JSONRes),
         JSONRes = ok(json.array(FactJsons))
    then
        InputFacts = list.map(json_to_fact, FactJsons),
        plugin.infer_and_check(InputFacts, Inferred, Conflicts),
        All = list.append(
            list.map((F -> fact_to_json(F, no)), Inferred),
            list.map((F -> fact_to_json(F, yes)), Conflicts)
        ),
        json.write_file("mercury_output.json", json.array(All), !IO)
    else
        io.write_string("Error parsing input or JSON\n", !IO)
    ).