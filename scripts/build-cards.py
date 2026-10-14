#!/usr/bin/env python3
"""Build football-card assets + shared/cards.js. Usage: python3 -I scripts/build-cards.py <source dir> [<source dir>...]"""
import os
import re
import subprocess
import sys
import unicodedata
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUFFIX_CAT = {'золото': 'common', 'эксклюзив': 'rare', 'платина': 'legend'}
# key: filename stem without _золото/_эксклюзив/_платина (futsal keeps _футзал); value: Latin name from the md list
M = {
'Ада_Хегерберг': 'Ada Hegerberg', 'Адольфо_Фернандес_футзал': 'Adolfo Fernández', 'Айкардо_футзал': 'Aicardo',
'Айтана_Бонмати': 'Aitana Bonmatí', 'Алексия_Путельяс': 'Alexia Putellas', 'Алессандро_Дель_Пьеро': 'Alessandro Del Piero',
'Алессия_Руссо': 'Alessia Russo', 'Алехандро_Бальде': 'Alejandro Balde', 'Алехандро_Гарначо': 'Alejandro Garnacho',
'Алисон': 'Alisson', 'Альварес': 'Julián Álvarez', 'Альфредо_Ди_Стефано': 'Alfredo Di Stéfano', 'Амад_Диалло': 'Amad Diallo',
'Андреа_Пирло': 'Andrea Pirlo', 'Андрес_Иньеста': 'Andrés Iniesta', 'Анн_Катерин_Бергер': 'Ann-Katrin Berger',
'Антони': 'Antony', 'Анхель_Корреа': 'Ángel Correa', 'Араухо': 'Ronald Araújo', 'Арьен_Роббен': 'Arjen Robben',
'Асисат_Ошоала': 'Asisat Oshoala', 'Барелла': 'Nicolò Barella', 'Бастони': 'Alessandro Bastoni', 'Бекхэм': 'David Beckham',
'Беллингем': 'Jude Bellingham', 'Бен_Уайт': 'Ben White', 'Бенжамен_Павар': 'Benjamin Pavard', 'Беньямин_Шешко': 'Benjamin Šeško',
'Бернарду_Силва': 'Bernardo Silva', 'Бобби_Чарльтон': 'Bobby Charlton', 'Брайан_Мбеумо': 'Bryan Mbeumo',
'Бруно_Гимарайнш': 'Bruno Guimarães', 'Бруно_Коэлью_футзал': 'Bruno Coelho', 'Бруну_Фернандеш': 'Bruno Fernandes',
'Вальверде': 'Federico Valverde', 'Ван_Дейк': 'Virgil van Dijk', 'Ватару_Эндо': 'Wataru Endō', 'Венди_Ренар': 'Wendie Renard',
'Вестон_Маккенни': 'Weston McKennie', 'Вивианн_Мидема': 'Vivianne Miedema', 'Виктор_Бонифейс': 'Victor Boniface',
'Винисиус': 'Vinícius Júnior', 'Вирц': 'Florian Wirtz', 'Влахович': 'Dušan Vlahović', 'Габриэл_Жезус': 'Gabriel Jesus',
'Гави': 'Gavi', 'Гарет_Бэйл': 'Gareth Bale', 'Гарринча': 'Garrincha', 'Гвардиол': 'Joško Gvardiol',
'Георге_Хаджи': 'Gheorghe Hagi', 'Герд_Мюллер': 'Gerd Müller', 'Гнабри': 'Serge Gnabry', 'Гризманн': 'Antoine Griezmann',
'Грилиш': 'Jack Grealish', 'Давид_Вилья': 'David Villa', 'Дани_Ольмо': 'Dani Olmo', 'Де_Брёйне': 'Kevin De Bruyne',
'Де_Лигт': 'Matthijs de Ligt', 'Дебинья': 'Debinha', 'Дембеле': 'Ousmane Dembélé', 'Джанлуиджи_Буффон': 'Gianluigi Buffon',
'Джейдон_Санчо': 'Jadon Sancho', 'Джио_Рейна': 'Gio Reyna', 'Джонатан_Дэвид': 'Jonathan David', 'Джордж_Бест': 'George Best',
'Джордж_Веа': 'George Weah', 'Джошуа_Киммих': 'Joshua Kimmich', 'Дидье_Дрогба': 'Didier Drogba', 'Диего_футзал': 'Dyego',
'Димарко': 'Federico Dimarco', 'Доминик_Собослаи': 'Dominik Szoboszlai', 'Доннарумма': 'Gianluigi Donnarumma',
'Дуглас_Жуниор_футзал': 'Douglas Junior', 'Дэвис': 'Alphonso Davies', 'Жоау_Невеш': 'João Neves',
'Жоау_Пальинья': 'João Palhinha', 'Жоау_Феликс': 'João Félix', 'Жота': 'Diogo Jota', 'Жуан_Матуш_футзал': 'João Matos',
'Зики_Те_футзал': 'Zicky Té', 'Зинедин_Зидан': 'Zinedine Zidane', 'Златан_Ибрагимович': 'Zlatan Ibrahimović',
'Зоммер': 'Yann Sommer', 'Икер_Касильяс': 'Iker Casillas', 'Илкай_Гюндоган': 'İlkay Gündoğan', 'Иммобиле': 'Ciro Immobile',
'Йохан_Кройф': 'Johan Cruyff', 'Каземиро': 'Casemiro', 'Кака': 'Kaká', 'Канселу': 'João Cancelo',
'Каору_Митома': 'Kaoru Mitoma', 'Карвахаль': 'Dani Carvajal', 'Карим_Бензема': 'Karim Benzema',
'Карлос_Ортис_футзал': 'Carlos Ortiz', 'Карлос_Тевес': 'Carlos Tévez', 'Каролине_Грэм_Хансен': 'Caroline Graham Hansen',
'Кафу': 'Cafu', 'Кварацхелия': 'Khvicha Kvaratskhelia', 'Кейн': 'Harry Kane', 'Кенан_Йылдыз': 'Kenan Yıldız',
'Кике_Бонед_футзал': 'Kike Boned', 'Кларенс_Зеедорф': 'Clarence Seedorf', 'Конами': 'Ibrahima Konaté',
'Кристиан_Ромеро': 'Cristian Romero', 'Кристиан_Эриксен': 'Christian Eriksen', 'Кристиана_Джирелли': 'Cristiana Girelli',
'Криштиану_Роналду': 'Cristiano Ronaldo', 'Кунде': 'Jules Koundé', 'Куртуа': 'Thibaut Courtois', 'Кьеза': 'Federico Chiesa',
'Лаутаро': 'Lautaro Martínez', 'Леандро_Лино_футзал': 'Leandro Lino', 'Леау': 'Rafael Leão', 'Левандовски': 'Robert Lewandowski',
'Леон_Горецка': 'Leon Goretzka', 'Линда_Кайседо': 'Linda Caicedo', 'Линдси_Хоран': 'Lindsey Horan',
'Лисандро_Мартинес': 'Lisandro Martínez', 'Лорен_Джеймс': 'Lauren James', 'Луис_Амадо_футзал': 'Luis Amado',
'Луис_Суарес': 'Luis Suárez', 'Луиш_Фигу': 'Luís Figo', 'Лука_Модрич': 'Luka Modrić', 'Мак_Аллистер': 'Alexis Mac Allister',
'Маноэл_Тобиас_футзал': 'Manoel Tobias', 'Марадона': 'Diego Maradona', 'Маркиньос': 'Marquinhos',
'Марко_ван_Бастен': 'Marco van Basten', 'Маркус_Тюрам': 'Marcus Thuram', 'Марта': 'Marta',
'Мартин_Субименди': 'Martin Zubimendi', 'Мартин_Эдегор': 'Martin Ødegaard', 'Мартинелли': 'Gabriel Martinelli',
'Мбаппе': 'Kylian Mbappé', 'Мейсон_Маунт': 'Mason Mount', 'Меньян': 'Mike Maignan', 'Месси': 'Lionel Messi',
'Месут_Озил': 'Mesut Özil', 'Мехди_Тареми': 'Mehdi Taremi', 'Мигелин_футзал': 'Miguelín', 'Микель_Мерино': 'Mikel Merino',
'Микки_ван_де_Вен': 'Micky van de Ven', 'Мирослав_Клозе': 'Miroslav Klose', 'Мишель_Платини': 'Michel Platini',
'Мойсес_Кайседо': 'Moisés Caicedo', 'Мохаммед_Кудус': 'Mohammed Kudus', 'Мусиала': 'Jamal Musiala',
'Мэллори_Свонсон': 'Mallory Swanson', 'Мэри_Эрпс': 'Mary Earps', 'Мюллер': 'Thomas Müller', 'Неймар': 'Neymar',
'Нету': 'Pedro Neto', 'Нико_Уильямс': 'Nico Williams', 'Николас_Отаменди': 'Nicolás Otamendi', 'Нойер': 'Manuel Neuer',
'Нуну_Мендещ': 'Nuno Mendes', 'Нуньес': 'Darwin Núñez', 'Облак': 'Jan Oblak', 'Ольга_Кармона': 'Olga Carmona',
'Орельен_Тчуамени': 'Aurélien Tchouaméni', 'Осимхен': 'Victor Osimhen', 'Пакета': 'Lucas Paquetá', 'Палмер': 'Cole Palmer',
'Пани_Варела_футзал': 'Pany Varela', 'Паоло_Мальдини': 'Paolo Maldini', 'Патрик_Виейра': 'Patrick Vieira',
'Пау_Кубарси': 'Pau Cubarsí', 'Пауло_Дибала': 'Paulo Dybala', 'Педри': 'Pedri', 'Педро_Порро': 'Pedro Porro',
'Пеле': 'Pelé', 'Пернилле_Хардер': 'Pernille Harder', 'Пито_футзал': 'Pito', 'Пулишич': 'Christian Pulisic',
'Пьер_Эмерик_Обамеянг': 'Pierre-Emerick Aubameyang', 'Райс': 'Declan Rice', 'Райя': 'David Raya', 'Рамуш': 'Gonçalo Ramos',
'Расмус_Хойлунд': 'Rasmus Højlund', 'Рафаэль_Геррейру': 'Raphaël Guerreiro', 'Рафинья': 'Raphinha', 'Рашфорд': 'Marcus Rashford',
'Ривалдо': 'Rivaldo', 'Рикардиньо_футзал': 'Ricardinho', 'Рис_Джеймс': 'Reece James', 'Ришарлисон': 'Richarlison',
'Рияд_Марез': 'Riyad Mahrez', 'Роберто_Карлос': 'Roberto Carlos', 'Робертсон': 'Andrew Robertson',
'Робин_ван_Перси': 'Robin van Persie', 'Родри': 'Rodri', 'Родриго_Де_Пауль': 'Rodrigo De Paul',
'Родриго_Капита_футзал': 'Rodrigo Capita', 'Родриго': 'Rodrygo', 'Ромарио': 'Romário', 'Ромелу_Лукаку': 'Romelu Lukaku',
'Роналдиньо': 'Ronaldinho', 'Роналдо_Назарио': 'Ronaldo Nazário', 'Рубен_Диаш': 'Rúben Dias', 'Рууд_ван_Нистелрой': 'Ruud van Nistelrooy',
'Рюдигер': 'Antonio Rüdiger', 'Садио_Мане': 'Sadio Mané', 'Сайль_Ларин': 'Cyle Larin', 'Сака': 'Bukayo Saka',
'Салах': 'Mohamed Salah', 'Салиба': 'William Saliba', 'Сальма_Паральюэло': 'Salma Paralluelo',
'Самюэль_Этоо': "Samuel Eto'o", 'Сане': 'Leroy Sané', 'Сардар_Азмун': 'Sardar Azmoun', 'Серхио_Лосано_футзал': 'Sergio Lozano',
'Серхио_Рамос': 'Sergio Ramos', 'Сон': 'Son Heung-min', 'София_Смит': 'Sophia Smith', 'Стивен_Джеррард': 'Steven Gerrard',
'Стоунз': 'John Stones', 'Сэм_Керр': 'Sam Kerr', 'Такефуса_Кубо': 'Takefusa Kubo', 'Тео_Эрнандес': 'Theo Hernández',
'Тер_Штеген': 'Marc-André ter Stegen', 'Тим_Веа': 'Tim Weah', 'Томаш_Пасу_футзал': 'Tomás Paçó', 'Тонали': 'Sandro Tonali',
'Тони_Кроос': 'Toni Kroos', 'Трент_Александр_Арнольд': 'Trent Alexander-Arnold', 'Тринити_Родман': 'Trinity Rodman',
'Тьерри_Анри': 'Thierry Henry', 'Уилфрид_Заха': 'Wilfried Zaha', 'Уокер': 'Kyle Walker', 'Упамекано': 'Dayot Upamecano',
'Уэйн_Руни': 'Wayne Rooney', 'Фалкао_футзал': 'Falcão', 'Ференц_Пушкаш': 'Ferenc Puskás', 'Фернандиньо_футзал': 'Fernandinho',
'Фернандо_Торрес': 'Fernando Torres', 'Феррао_футзал': 'Ferrão', 'Фикайо_Томори': 'Fikayo Tomori', 'Фоден': 'Phil Foden',
'Франк_Рибери': 'Franck Ribéry', 'Франц_Беккенбауэр': 'Franz Beckenbauer', 'Франческо_Тотти': 'Francesco Totti',
'Фрэнк_Лэмпард': 'Frank Lampard', 'Хаверц': 'Kai Havertz', 'Хави_Родригес_футзал': 'Javi Rodríguez', 'Хави': 'Xavi',
'Хадиджа_Шоу': 'Khadija Shaw', 'Хакан_Чалханоглу': 'Hakan Çalhanoğlu', 'Хаким_Зиеш': 'Hakim Ziyech', 'Хакими': 'Achraf Hakimi',
'Хамес_Родригес': 'James Rodríguez', 'Хигита_футзал': 'Higuita', 'Холанд': 'Erling Haaland', 'Христо_Стоичков': 'Hristo Stoichkov',
'Шумахер_футзал': 'Schumacher', 'Эдер_Милитао': 'Éder Militão', 'Эдерсон': 'Ederson', 'Эдуардо_Камавинга': 'Eduardo Camavinga',
'Эндрик': 'Endrick', 'Энцо': 'Enzo Fernández', 'Эрик_Кантонa': 'Eric Cantona', 'Юи_Хасэгава': 'Yui Hasegawa',
'Ямаль': 'Lamine Yamal', 'Яя_Туре': 'Yaya Touré', 'Эусебио': 'Eusébio',
# second archive: legends
'Рууд_Гуллит': 'Ruud Gullit', 'Лотар_Маттеус': 'Lothar Matthäus', 'Зико': 'Zico', 'Сократес': 'Sócrates',
'Паоло_Росси': 'Paolo Rossi', 'Лев_Яшин': 'Lev Yashin', 'Бобби_Мур': 'Bobby Moore', 'Стэнли_Мэттьюз': 'Stanley Matthews',
'Джузеппе_Меацца': 'Giuseppe Meazza', 'Раймон_Копа': 'Raymond Kopa', 'Жюст_Фонтен': 'Just Fontaine', 'Диди': 'Didi',
# second archive: Ukrainians (_золото; category comes from the md section, there is no _футзал suffix)
'Андрей_Шевченко': 'Andriy Shevchenko', 'Олег_Блохин': 'Oleh Blokhin', 'Сергей_Ребров': 'Serhiy Rebrov',
'Анатолий_Тимощук': 'Anatoliy Tymoshchuk', 'Андрей_Ярмоленко': 'Andriy Yarmolenko', 'Александр_Зинченко': 'Oleksandr Zinchenko',
'Андрей_Пятов': 'Andriy Pyatov', 'Андрей_Воронин': 'Andriy Voronin', 'Руслан_Ротань': 'Ruslan Rotan',
'Дмитрий_Чигринский': 'Dmytro Chygrynskyi', 'Евгений_Коноплянка': 'Yevhen Konoplyanka', 'Михаил_Мудрик': 'Mykhailo Mudryk',
'Артем_Довбик': 'Artem Dovbyk', 'Илья_Забарный': 'Illia Zabarnyi', 'Сергей_Сидорчук': 'Serhiy Sydorchuk',
'Виктор_Цыганков': 'Viktor Tsyhankov', 'Александр_Шовковский': 'Oleksandr Shovkovskyi', 'Олег_Лужный': 'Oleh Luzhny',
'Игорь_Беланов': 'Igor Belanov', 'Александр_Сухов': 'Oleksandr Sukhov', 'Игорь_Корсун': 'Ihor Korsun',
'Даниил_Абакшин': 'Danyil Abakshyn', 'Петр_Шотурма': 'Petro Shoturma', 'Андрей_Мельник': 'Andrii Melnyk',
'Николай_Микитюк': 'Mykola Mykytiuk',
}

# Files whose player is absent from the md list (name confirmed by hand)
EXTRA = {'Kenan Yıldız'}


def slug(n):
    n = n.translate(str.maketrans({'ı': 'i', 'ø': 'o', 'Ø': 'O'}))
    s = unicodedata.normalize('NFKD', n).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def parse_md(path):
    sec, ua, order, uas = None, False, [], set()  # order: (cat, name); uas: Ukrainian names
    with open(path, encoding='utf-8') as fh:
        lines = [line.rstrip() for line in fh]
    for line in lines:
        if line.startswith('#'):
            h = line.lstrip('# ')
            if h.startswith('Золотая рамка') and 'украинск' in h:
                ua, sec = True, None  # subsections below pick the category
                continue
            if line.startswith('###') and ua:
                sec = 'common' if h.startswith('Футбол') else 'futsal' if h.startswith('Футзал') else None
                continue
            ua = False
            sec = ('common' if h.startswith(('Мужской', 'Женский')) else
                   'futsal' if h.startswith('Мировой футзал') else
                   'rare' if h.startswith('Розовая') else
                   'legend' if h.startswith('Платиновая') else None)
            continue
        if line.startswith('---'):
            sec = None  # the closing note is not a name list
        elif sec and line:
            for n in line.rstrip('.').split(';'):
                if n.strip():
                    order.append((sec, n.strip()))
                    if ua:
                        uas.add(n.strip())
    return order, uas


def main():
    srcs = sys.argv[1:]
    mds = [os.path.join(d, f) for d in srcs for f in sorted(os.listdir(d)) if f.endswith('.md')]
    if not mds:
        sys.exit('build-cards: no md list in the source dirs')
    md, uas = parse_md(mds[0])
    md_cat = {}
    for c, n in md:
        assert n not in md_cat, n
        md_cat[n] = c
    entries, bad = {}, []
    pngs = [(d, f) for d in srcs for f in sorted(os.listdir(d)) if f.endswith('.png')]
    for src, f in pngs:
        stem = f[:-4]
        key, _, suf = stem.rpartition('_')
        if suf in SUFFIX_CAT:
            cat = SUFFIX_CAT[suf]
        else:
            key, cat = stem, 'common' if stem in ('Ямаль', 'Куртуа') else 'rare'
        if key.endswith('_футзал'):
            cat = 'futsal'
        name = M.get(key)
        if name in uas:  # Ukrainian cards are all _золото: the category comes from the md section
            cat = md_cat.get(name, cat)
        if name in EXTRA:  # not in the md list: appended after the md-ordered names of its category
            md.append((cat, name))
            md_cat[name] = cat
        if not name or name not in md_cat or md_cat[name] != cat:
            bad.append((f, name, cat, md_cat.get(name)))
            continue
        if name in entries:
            bad.append((f, name, 'duplicate', None))
            continue
        entries[name] = (cat, os.path.join(src, f))
    if bad:
        print('UNMATCHED:')
        for b in bad:
            print(' ', b)
        sys.exit(1)
    ids = [slug(n) for n in entries]
    assert len(set(ids)) == len(ids), 'duplicate ids'
    ordered = []
    for c in ('legend', 'rare', 'futsal', 'common'):
        # Ukrainians go after the world players of their category
        ordered += [(n, c) for cc, n in sorted(md, key=lambda t: t[1] in uas) if cc == c and n in entries]
    assert len(ordered) == len(entries)
    os.makedirs(os.path.join(ROOT, 'images/cards/thumb'), exist_ok=True)
    lines = []
    for n, c in ordered:
        i = slug(n)
        s = entries[n][1]
        full, th = (os.path.join(ROOT, 'images/cards', i + '.webp'), os.path.join(ROOT, 'images/cards/thumb', i + '.webp'))
        for out, w, h, q in ((full, 512, 1024, 78), (th, 256, 512, 62)):
            if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(s):
                subprocess.run(['cwebp', '-quiet', '-q', str(q), '-resize', str(w), str(h), s, '-o', out], check=True)
        lines.append("  { id: '%s', name: '%s', cat: '%s'%s }," % (i, n.replace("'", "\\'"), c, ', ua: true' if n in uas else ''))
    with open(os.path.join(ROOT, 'shared/cards.js'), 'w', encoding='utf-8') as fh:
        fh.write("// Football cards collection (generated by scripts/build-cards.py — do not edit by hand).\n"
                 "// cat: common | futsal | rare | legend. Images: images/cards/<id>.webp, thumbs in images/cards/thumb/.\n"
                 "window.KF_CARDS = [\n" + "\n".join(lines) + "\n];\n")
    print(Counter(c for _, c in ordered), len(ordered))
    miss = [(c, n) for c, n in md if n not in entries]
    print('md without image:', Counter(c for c, _ in miss))
    for c, n in miss:
        if c in ('legend', 'rare'):
            print('  ', c, n)



if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    try:
        main()
    except (OSError, subprocess.CalledProcessError) as e:
        sys.exit(f'build-cards: {e}')
